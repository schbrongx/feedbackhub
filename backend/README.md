# user.py User Management CLI for Feedback Hub

The command-line tool, `user.py`, is designed to manage users for the Feedback Hub backend application. It allows you to add new users, delete existing users, and change a user's password. User data is stored in a JSON configuration file (`config.json`), and passwords are securely hashed using bcrypt.

## Features

- **Add User:**  
  Create a new user with a username, password, and role (either `user` or `poweruser`).  
- **Delete User:**  
  Remove an existing user by username.
- **Change Password:**  
  Update the password for an existing user.
- **Secure Storage:**  
  Passwords are hashed with bcrypt (which automatically includes a salt) and stored in `config.json`.

## Requirements

- Python 3.x
- [bcrypt](https://pypi.org/project/bcrypt/) library  
  Install with:  
  ```bash
  pip install bcrypt
