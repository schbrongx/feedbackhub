#!/usr/bin/env python3
# file: user.py
import sys
import json
import bcrypt
import os
import getpass

CONFIG_FILE = "users.json"

def load_users():
    if not os.path.exists(CONFIG_FILE):
        return {"users": []}
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def save_users(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=4)

def add_user(username, password, role="user"):
    data = load_users()
    for user in data.get("users", []):
        if user["username"] == username:
            print(f"User {username} already exists.")
            return
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    data["users"].append({
        "username": username,
        "hashed_password": hashed,
        "role": role
    })
    save_users(data)
    print(f"User {username} added.")

def delete_user(username):
    data = load_users()
    users = data.get("users", [])
    new_users = [user for user in users if user["username"] != username]
    if len(new_users) == len(users):
        print(f"User {username} not found.")
    else:
        data["users"] = new_users
        save_users(data)
        print(f"User {username} deleted.")

def change_password(username, password):
    data = load_users()
    found = False
    for user in data.get("users", []):
        if user["username"] == username:
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            user["hashed_password"] = hashed
            found = True
            break
    if not found:
        print(f"User {username} not found.")
    else:
        save_users(data)
        print(f"Password for {username} updated.")

def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  user.py add <username> [role]        -- Adds a user (default role: user), roles: user|poweruser")
        print("  user.py delete <username>            -- Deletes a user")
        print("  user.py password <username> <password>  -- Changes a user's password")
        sys.exit(1)
    command = sys.argv[1].lower()
    if command == "add":
        username = sys.argv[2]
        role = sys.argv[3] if len(sys.argv) >= 4 else "user"
        password = getpass.getpass("Enter password: ")
        add_user(username, password, role)
    elif command == "delete":
        username = sys.argv[2]
        delete_user(username)
    elif command == "password":
        if len(sys.argv) != 4:
            print("Usage: user.py password <username> <new_password>")
            sys.exit(1)
        username = sys.argv[2]
        new_password = sys.argv[3]
        change_password(username, new_password)
    else:
        print("Unknown command.")
        sys.exit(1)

if __name__ == "__main__":
    main()
