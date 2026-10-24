from bcrypt import generate_password_hash, check_password_hash

def create_user(db, name, email, password):
    hashed = generate_password_hash(password).decode('utf-8')
    user = {"name": name, "email": email, "password": hashed}
    db.users.insert_one(user)
    return user

def find_user_by_email(db, email):
    return db.users.find_one({"email": email})

def verify_password(hashed_pw, password):
    return check_password_hash(hashed_pw, password)
