# Add these new endpoints to the end of admin_views.py


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_document(request):
    """
    Validate or invalidate a specific document
    """
    try:
        application_id = request.data.get('application_id')
        document_type = request.data.get('document_type')
        is_valid = request.data.get('is_valid')

        if not all([application_id, document_type is not None, is_valid is not None]):
            return Response({
                'status': 'error',
                'message': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update document validation status
        doc_validation = getattr(application, 'document_validation', {}) or {}
        doc_validation[document_type] = is_valid
        application.document_validation = doc_validation
        application.save()

        logger.info(f"Document {document_type} validated as {is_valid} for {application_id}")

        return Response({
            'status': 'success',
            'message': 'Document validation updated'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error validating document: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_enrollment_number(request):
    """
    Generate enrollment number: A25PBA2101000
    - A25: From portal_applicationsettings.admission_code in lsc_admin database
    - PBA: From programme (currently hardcoded, can be made dynamic)
    - 2101: From api_application.lsc_code (extract numbers only)
    - 0001: Sequential number
    """
    try:
        from django.db import connections
        application_id = request.data.get('application_id')

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Extract LSC code (remove LC prefix, keep only numbers)
        lsc_code_full = application.application_id.split('/')[2] if '/' in application.application_id else 'LC2101'
        lsc_code = lsc_code_full.replace('LC', '')  # Remove LC, keep 2101

        # Get admission code from portal_applicationsettings in lsc_admin database
        admission_code = 'A25'  # Default
        try:
            with connections['lsc_admin'].cursor() as cursor:
                cursor.execute("""
                    SELECT admission_code 
                    FROM portal_applicationsettings 
                    WHERE is_open = TRUE 
                    ORDER BY id DESC 
                    LIMIT 1
                """)
                row = cursor.fetchone()
                if row and row[0]:
                    admission_code = row[0]
        except Exception as e:
            logger.warning(f"Could not fetch admission_code from lsc_admin: {e}")

        # Get programme code (first 3 letters of programme in uppercase)
        programme = application.programme_applied or 'DIPLOMA'
        if 'PG' in programme.upper() or 'POST' in programme.upper() or 'MBA' in programme.upper() or 'MCA' in programme.upper():
            programme_code = 'PBA'  # Postgraduate
        elif 'UG' in programme.upper() or 'BACHELOR' in programme.upper() or 'B.SC' in programme.upper() or 'B.COM' in programme.upper():
            programme_code = 'UGA'  # Undergraduate
        else:
            programme_code = 'DIP'  # Diploma

        # Get the next sequential number for this LSC and programme
        # Count existing enrollments with same pattern
        count = Application.objects.filter(
            enrollment_no__startswith=f"{admission_code}{programme_code}{lsc_code}"
        ).count()

        sequential_number = str(count + 1).zfill(4)  # Pad with zeros: 0001, 0002, etc.

        # Generate final enrollment number
        enrollment_no = f"{admission_code}{programme_code}{lsc_code}{sequential_number}"

        logger.info(f"Generated enrollment number: {enrollment_no} for {application_id}")

        return Response({
            'status': 'success',
            'enrollment_no': enrollment_no
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error generating enrollment number: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def save_verification(request):
    """
    Save complete verification details including eligibility, admission status, and enrollment number
    """
    try:
        application_id = request.data.get('application_id')
        eligibility_status = request.data.get('eligibility_status')
        eligibility_reason = request.data.get('eligibility_reason', '')
        admission_status = request.data.get('admission_status')
        admission_reason = request.data.get('admission_reason', '')
        enrollment_no = request.data.get('enrollment_no', '')
        document_validation = request.data.get('document_validation', {})

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update eligibility status
        if eligibility_status:
            application.eligibility_status = eligibility_status
            application.eligibility_verified = (eligibility_status == 'Eligible')
            if eligibility_reason:
                application.verification_remarks = eligibility_reason

        # Update admission status
        if admission_status:
            application.admission_confirmed = (admission_status == 'Confirmed')
            if admission_reason:
                application.rejection_reason = admission_reason

        # Update enrollment number (only if confirmed and eligible)
        if enrollment_no and application.eligibility_verified and application.admission_confirmed:
            application.enrollment_no = enrollment_no

        # Update document validation
        if document_validation:
            application.document_validation = document_validation

        # Set verification date and user
        application.verified_date = datetime.now()
        application.verified_by = 'LSC Admin'  # You can pass actual admin user

        application.save()

        logger.info(f"Verification saved for application: {application_id}")

        return Response({
            'status': 'success',
            'message': 'Verification details saved successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error saving verification: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
