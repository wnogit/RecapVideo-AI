/// User Model
class User {
  final String id;
  final String email;
  final String name;
  final int credits;
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.credits,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      email: json['email'] as String,
      name: json['name'] as String,
      credits: json['credit_balance'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'credit_balance': credits, // Match fromJson key
      'created_at': createdAt.toIso8601String(),
    };
  }
}
