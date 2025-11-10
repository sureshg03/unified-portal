"""
Paytm Checksum Generation and Verification Library for Python/Django
Based on Paytm's official PHP library
"""
import base64
import string
import random
import hashlib
from Crypto.Cipher import AES


class PaytmChecksum:
    
    iv = '@@@@&&&&####$$$$'
    
    @staticmethod
    def generate_signature(params, merchant_key):
        """Generate signature for Paytm"""
        params_string = PaytmChecksum.__get_string_by_params(params)
        return PaytmChecksum.__generate_signature(params_string, merchant_key)
    
    @staticmethod
    def verify_signature(params, merchant_key, checksum):
        """Verify Paytm signature"""
        if 'CHECKSUMHASH' in params:
            del params['CHECKSUMHASH']
        params_string = PaytmChecksum.__get_string_by_params(params)
        return PaytmChecksum.__verify_signature(params_string, merchant_key, checksum)
    
    @staticmethod
    def __generate_signature(params_string, merchant_key):
        """Internal method to generate signature"""
        salt = PaytmChecksum.__generate_random_string(4)
        final_string = params_string + "|" + salt
        hasher = hashlib.sha256(final_string.encode())
        hash_string = hasher.hexdigest() + salt
        return PaytmChecksum.__encrypt(hash_string, merchant_key)
    
    @staticmethod
    def __verify_signature(params_string, merchant_key, checksum):
        """Internal method to verify signature"""
        try:
            decrypted = PaytmChecksum.__decrypt(checksum, merchant_key)
            salt = decrypted[-4:]
            final_string = params_string + "|" + salt
            hasher = hashlib.sha256(final_string.encode())
            hash_string = hasher.hexdigest() + salt
            return hash_string == decrypted
        except Exception:
            return False
    
    @staticmethod
    def __get_string_by_params(params):
        """Convert params dict to string"""
        params_list = []
        for key in sorted(params.keys()):
            if key not in ['CHECKSUMHASH', 'REFUND']:
                value = params[key]
                params_list.append('' if value == 'null' else str(value))
        return '|'.join(params_list)
    
    @staticmethod
    def __generate_random_string(length):
        """Generate random string"""
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(length))
    
    @staticmethod
    def __pad(data):
        """Add PKCS7 padding"""
        length = 16 - (len(data) % 16)
        return data + (chr(length) * length).encode()
    
    @staticmethod
    def __unpad(data):
        """Remove PKCS7 padding"""
        return data[0:-data[-1]]
    
    @staticmethod
    def __encrypt(data, key):
        """Encrypt using AES-128-CBC"""
        key = hashlib.md5(key.encode()).digest()
        data = PaytmChecksum.__pad(data.encode())
        cipher = AES.new(key, AES.MODE_CBC, PaytmChecksum.iv.encode())
        encrypted = cipher.encrypt(data)
        return base64.b64encode(encrypted).decode()
    
    @staticmethod
    def __decrypt(data, key):
        """Decrypt using AES-128-CBC"""
        key = hashlib.md5(key.encode()).digest()
        encrypted = base64.b64decode(data)
        cipher = AES.new(key, AES.MODE_CBC, PaytmChecksum.iv.encode())
        decrypted = cipher.decrypt(encrypted)
        return PaytmChecksum.__unpad(decrypted).decode()


# Convenience functions
def generate_checksum(params, merchant_key):
    """Generate Paytm checksum"""
    return PaytmChecksum.generate_signature(params, merchant_key)


def verify_checksum(params, merchant_key, checksum):
    """Verify Paytm checksum"""
    return PaytmChecksum.verify_signature(params, merchant_key, checksum)
