
/// Form Validators
class Validators {
  /// Email validation
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email လိုအပ်ပါတယ်';
    }
    
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    
    if (!emailRegex.hasMatch(value)) {
      return 'Email format မမှန်ပါဘူး';
    }
    
    return null;
  }
  
  /// Required field validation
  static String? required(String? value, [String fieldName = 'Field']) {
    if (value == null || value.isEmpty) {
      return '$fieldName လိုအပ်ပါတယ်';
    }
    return null;
  }
  
  /// Password validation
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password လိုအပ်ပါတယ်';
    }
    
    if (value.length < 6) {
      return 'Password အနည်းဆုံး ၆ လုံး ရှိရမယ်';
    }
    
    return null;
  }
  
  /// Password confirmation validation
  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Password confirmation လိုအပ်ပါတယ်';
    }
    
    if (value != password) {
      return 'Passwords မတူညီပါဘူး';
    }
    
    return null;
  }
}
