/// Burmese Number Converter
/// 
/// Converts Arabic numerals (0-9) to Burmese/Myanmar numerals (၀-၉)
/// 
/// Usage:
/// ```dart
/// final burmeseNumber = BurmeseNumbers.convert(1234);
/// // Returns: '၁၂၃၄'
/// 
/// // Or use extension
/// final price = 5000.toBurmese();
/// // Returns: '၅၀၀၀'
/// ```

class BurmeseNumbers {
  /// Burmese digit mapping
  static const Map<String, String> _digitMap = {
    '0': '၀',
    '1': '၁',
    '2': '၂',
    '3': '၃',
    '4': '၄',
    '5': '၅',
    '6': '၆',
    '7': '၇',
    '8': '၈',
    '9': '၉',
  };

  /// Convert number to Burmese numerals
  static String convert(dynamic number) {
    final String numStr = number.toString();
    final StringBuffer result = StringBuffer();
    
    for (int i = 0; i < numStr.length; i++) {
      final char = numStr[i];
      result.write(_digitMap[char] ?? char);
    }
    
    return result.toString();
  }

  /// Convert Burmese numerals back to Arabic
  static String toArabic(String burmeseNumber) {
    final Map<String, String> reverseMap = {
      '၀': '0',
      '၁': '1',
      '၂': '2',
      '၃': '3',
      '၄': '4',
      '၅': '5',
      '၆': '6',
      '၇': '7',
      '၈': '8',
      '၉': '9',
    };
    
    final StringBuffer result = StringBuffer();
    for (int i = 0; i < burmeseNumber.length; i++) {
      final char = burmeseNumber[i];
      result.write(reverseMap[char] ?? char);
    }
    
    return result.toString();
  }

  /// Format number with comma separator in Burmese
  static String formatWithComma(dynamic number, {bool useBurmese = true}) {
    final String numStr = number.toString();
    final parts = numStr.split('.');
    final intPart = parts[0];
    final decPart = parts.length > 1 ? '.${parts[1]}' : '';
    
    // Add comma separators
    final buffer = StringBuffer();
    int count = 0;
    for (int i = intPart.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(intPart[i]);
      count++;
    }
    
    final formatted = buffer.toString().split('').reversed.join() + decPart;
    
    return useBurmese ? convert(formatted) : formatted;
  }
}

/// Extension for int
extension BurmeseIntExtension on int {
  /// Convert int to Burmese numeral string
  String toBurmese() => BurmeseNumbers.convert(this);
  
  /// Convert int to formatted Burmese numeral with commas
  String toBurmeseFormatted() => BurmeseNumbers.formatWithComma(this);
}

/// Extension for double
extension BurmeseDoubleExtension on double {
  /// Convert double to Burmese numeral string
  String toBurmese() => BurmeseNumbers.convert(this);
  
  /// Convert double to formatted Burmese numeral with commas
  String toBurmeseFormatted() => BurmeseNumbers.formatWithComma(this);
}

/// Extension for String (for already stringified numbers)
extension BurmeseStringExtension on String {
  /// Convert number string to Burmese numerals
  String toBurmeseNumber() => BurmeseNumbers.convert(this);
  
  /// Convert Burmese numeral string back to Arabic
  String toArabicNumber() => BurmeseNumbers.toArabic(this);
}
