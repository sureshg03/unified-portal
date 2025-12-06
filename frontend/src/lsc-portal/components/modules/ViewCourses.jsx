import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Plus,
  Filter,
  Download,
  Eye,
  BookOpen,
  GraduationCap,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';



export const ViewCourses = () => {
  const [courses, setCourses] = useState<>([]);
  const [filteredCourses, setFilteredCourses] = useState<>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    degree: 'all',
    branch: 'all',
    language: 'all'
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    course_short_code: '',
    course_full_name: '',
    branch_name: '',
    num_semesters: '',
    num_years: '',
    course_code: '',
    degree: '',
    application_fee: '',
    language: '',
    code2: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filters]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      // Note'll need to create a GET endpoint for fetching all courses
      const response = await fetch('http://localhost:8000/api/courses/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setCourses(data.data);
        } else {
          alert("Failed to fetch courses.");
        }
      } else {
        alert("Failed to fetch courses.");
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert("An error occurred while fetching courses.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = searchTerm === '' ||
        course.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.branch_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDegree = filters.degree === 'all' || course.degree === filters.degree;
      const matchesBranch = filters.branch === 'all' || course.branch_name === filters.branch;
      const matchesLanguage = filters.language === 'all' || course.language === filters.language;

      return matchesSearch && matchesDegree && matchesBranch && matchesLanguage;
    });

    setFilteredCourses(filtered);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setEditFormData({
      course_short_code.course_short_code,
      course_full_name.course_full_name,
      branch_name.branch_name,
      num_semesters.num_semesters.toString(),
      num_years.num_years.toString(),
      course_code.course_code,
      degree.degree,
      application_fee.application_fee,
      language.language || '',
      code2.code2 || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const response = await fetch(`http://localhost:8000/api/courses/${editingCourse.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body.stringify({
          ...editFormData,
          num_semesters(editFormData.num_semesters),
          num_years(editFormData.num_years),
          application_fee(editFormData.application_fee)
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert("Course updated successfully!");
        setIsEditDialogOpen(false);
        fetchCourses(); // Refresh the list
      } else {
        alert(data.message || "Failed to update course.");
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert("An error occurred while updating the course.");
    }
  };

  const getUniqueValues = (field Course) => {
    return Array.from(new Set(courses.map(course => course[field]).filter(Boolean)));
  };

  const exportToCSV = () => {
    const headers = ['Short Code', 'Full Name', 'Degree', 'Branch', 'Semesters', 'Years', 'Course Code', 'Language', 'Secondary Code', 'Fee'];
    const csvData = filteredCourses.map(course => [
      course.course_short_code,
      course.course_full_name,
      course.degree,
      course.branch_name,
      course.num_semesters,
      course.num_years,
      course.course_code,
      course.language || '',
      course.code2 || '',
      course.application_fee
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Header */}
      <>
        <>
          <>
            Course Management
          <>
          <>
            View, edit, and manage all course offerings
          <>
        <>
        <>
          <>
          <>
            {filteredCourses.length} Courses
          <>
        <>
      <>

      {/* Stats Cards */}
      <>
        <>
          <>
            <>
              <>
            <>
            <>
              <>Total Courses<>
              <>{courses.length}<>
            <>
          <>
        <>

        <>
          <>
            <>
              <>
            <>
            <>
              <>Degrees<>
              <>{getUniqueValues('degree').length}<>
            <>
          <>
        <>

        <>
          <>
            <>
              <>
            <>
            <>
              <>Branches<>
              <>{getUniqueValues('branch_name').length}<>
            <>
          <>
        <>

        <>
          <>
            <>
              <>
            <>
            <>
              <>Avg Fee<>
              <>
                ₹{courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + parseFloat(course.application_fee), 0) / courses.length) : 0}
              <>
            <>
          <>
        <>
      <>

      {/* Filters and Actions */}
      <>
        <>
          <>
            <>
            Filters & Actions
          <>
        <>
        <>
          <>
            {/* Search */}
            <>
              <>
                <>
                <> setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                />
              <>
            <>

            {/* Filters */}
            <> setFilters(prev => ({ ...prev, degree.target.value }))}
              className="w-full lg-48 px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
            >
              <>All Degrees<>
              {getUniqueValues('degree').map(degree => (
                <>{degree}<>
              ))}
            <>

            <> setFilters(prev => ({ ...prev, branch.target.value }))}
              className="w-full lg-48 px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
            >
              <>All Branches<>
              {getUniqueValues('branch_name').map(branch => (
                <>{branch}<>
              ))}
            <>

            <> setFilters(prev => ({ ...prev, language.target.value }))}
              className="w-full lg-48 px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
            >
              <>All Languages<>
              {getUniqueValues('language').map(language => (
                <>{language}<>
              ))}
            <>
          <>

          {/* Action Buttons */}
          <>
            <>
              <>
              Export CSV
            <>
          <>
        <>
      <>

      {/* Courses Table */}
      <>
        <>
          <>
            <>
              <>
                <>
                Courses ({filteredCourses.length})
              <>
            <>
          <>
          <>
            {isLoading ? (
              <>
                <><>
              <>
            ) .length === 0 ? (
              <>
                <>
                <>No courses found<>
                <>
                  {searchTerm || Object.values(filters).some(f => f !== 'all') ? 'Try adjusting your filters.' : 'Start by adding some courses.'}
                <>
              <>
            ) : (
              <>
                <>
                  <>
                    <>
                      <>Short Code<>
                      <>Full Name<>
                      <>Degree<>
                      <>Branch<>
                      <>Duration<>
                      <>Fee<>
                      <>Language<>
                      <>Actions<>
                    <>
                  <>
                  <>
                    {filteredCourses.map((course) => (
                      <>
                        <>
                          <>
                            {course.course_short_code}
                          <>
                        <>
                        <>{course.course_full_name}<>
                        <>
                          <>
                            {course.degree}
                          <>
                        <>
                        <>{course.branch_name}<>
                        <>
                          <>
                            <>
                            {course.num_years}Y {course.num_semesters}S
                          <>
                        <>
                        <>
                          <>
                            <>
                            ₹{course.application_fee}
                          <>
                        <>
                        <>
                          {course.language ? (
                            <>{course.language}<>
                          ) : (
                            <>-<>
                          )}
                        <>
                        <>
                          <>
                            <> handleEdit(course)}
                              className="h-8 w-8 p-0 hover-blue-50 hover-blue-600 rounded-md flex items-center justify-center"
                            >
                              <>
                            <>
                          <>
                        <>
                      <>
                    ))}
                  <>
                <>
              <>
            )}
          <>
        <>
      <>

      {/* Edit Modal */}
      {isEditDialogOpen && (
        <>
          <>
            <>
              <>
                <>
                <>Edit Course<>
              <>
              <>Update the course information below.<>
              <>
                <>
                  <>
                    <>Course Short Code *<>
                    <> setEditFormData(prev => ({ ...prev, course_short_code.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Course Full Name *<>
                    <> setEditFormData(prev => ({ ...prev, course_full_name.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Branch Name<>
                    <> setEditFormData(prev => ({ ...prev, branch_name.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Degree *<>
                    <> setEditFormData(prev => ({ ...prev, degree.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Number of Semesters *<>
                    <> setEditFormData(prev => ({ ...prev, num_semesters.target.value }))}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Number of Years *<>
                    <> setEditFormData(prev => ({ ...prev, num_years.target.value }))}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Course Code<>
                    <> setEditFormData(prev => ({ ...prev, course_code.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Application Fee (₹) *<>
                    <> setEditFormData(prev => ({ ...prev, application_fee.target.value }))}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Language<>
                    <> setEditFormData(prev => ({ ...prev, language.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>

                  <>
                    <>Secondary Code<>
                    <> setEditFormData(prev => ({ ...prev, code2.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus-none focus-2 focus-blue-500 focus-blue-500"
                    />
                  <>
                <>
                <>
                  <> setIsEditDialogOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md hover-gray-50 focus-none focus-2 focus-blue-500 focus-blue-500">
                    Cancel
                  <>
                  <>
                    Update Course
                  <>
                <>
              <>
            <>
          <>
        <>
      )}
    <>
  );
};


