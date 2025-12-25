# Test Cases - Login and User Profile Management

## Test Case Documentation

| Test ID | Module / Feature | Objective | Steps | Expected Results | Status (P/F/B) |
|---------|------------------|-----------|-------|------------------|----------------|
| TC1-101 | Login Page | Verify that clicking on login button on home page loads the login page | 1. Navigate to the home page (/) <br> 2. Locate the "Login" button in the navigation bar (desktop) or mobile menu <br> 3. Click on the "Login" button | 1. User is redirected to the login page (/auth/login) <br> 2. Login page displays with the following elements: <br>    - Page title: "National Sampling Frame Dashboard" <br>    - Subtitle: "National Statistics Bureau of Bhutan" <br>    - Email address input field <br>    - Password input field <br>    - "Sign in" button <br>    - "Back to Home" link <br> 3. Particles.js background animation is visible (if loaded) <br> 4. Form fields are empty and enabled | P |
| TC1-102 | View User Profile on Top bar | Verify that user can view their profile information from the top bar | 1. Log in to the application with valid credentials <br> 2. Navigate to any admin dashboard page (user must be authenticated) <br> 3. Locate the user avatar/profile icon in the top right corner of the admin top bar <br> 4. Click on the user avatar/profile icon | 1. A profile popover opens displaying: <br>    - User's profile image (or avatar with first letter of name) <br>    - User's full name <br>    - User's role (e.g., Admin, Supervisor, Enumerator) <br>    - User's email address with envelope icon <br>    - User's phone number (if available) with phone icon <br> 2. Three action buttons are visible: <br>    - "Edit Profile" button <br>    - "Change Password" button <br>    - "Sign Out" button <br> 3. All information is correctly displayed and matches the logged-in user's data | P |
| TC1-103 | Update Profile | Verify that user can update their profile information (name, email, phone number) | 1. Log in to the application with valid credentials <br> 2. Click on the user avatar/profile icon in the top bar <br> 3. Click on the "Edit Profile" button in the profile popover <br> 4. Verify that the Edit Profile dialog opens with current user data pre-filled <br> 5. Modify one or more fields (name, email address, or phone number) <br> 6. Click on the "Update Profile" button <br> 7. Wait for the update to complete | 1. Edit Profile dialog opens with: <br>    - Full Name field pre-filled with current name <br>    - Email Address field pre-filled with current email <br>    - Phone Number field pre-filled with current phone (if available) <br>    - Info message stating "Only the fields you modify will be updated. CID and role cannot be changed." <br>    - "Cancel" and "Update Profile" buttons <br> 2. After clicking "Update Profile": <br>    - Loading indicator appears on the button <br>    - Dialog is disabled during update <br>    - Success toast message appears: "Profile updated successfully" <br>    - Dialog closes automatically <br>    - Updated information is reflected in the profile popover <br> 3. If no changes are made, a warning message appears: "Please make at least one change to update your profile." | P |
| TC1-104 | Change Password | Verify that user can change their password | 1. Log in to the application with valid credentials <br> 2. Click on the user avatar/profile icon in the top bar <br> 3. Click on the "Change Password" button in the profile popover <br> 4. Verify that the Change Password dialog opens <br> 5. Enter the current password in the "Current Password" field <br> 6. Enter a new password (minimum 6 characters) in the "New Password" field <br> 7. Enter the same new password in the "Confirm New Password" field <br> 8. Click on the "Change Password" button <br> 9. Wait for the password change to complete | 1. Change Password dialog opens with: <br>    - Current Password field (with toggle mask option) <br>    - New Password field (with toggle mask and password strength feedback) <br>    - Confirm New Password field (with toggle mask option) <br>    - Info message: "Make sure your new password is strong and different from your current password." <br>    - "Cancel" and "Change Password" buttons <br> 2. Validation checks: <br>    - If current password is empty: Warning "Please enter your current password." <br>    - If new password is empty: Warning "Please enter a new password." <br>    - If new password is less than 6 characters: Warning "New password must be at least 6 characters long." <br>    - If passwords don't match: Warning "New password and confirmation do not match." <br>    - If new password equals current password: Warning "New password must be different from current password." <br> 3. After successful password change: <br>    - Loading indicator appears on the button <br>    - Dialog is disabled during change <br>    - Success toast message appears: "Password changed successfully" <br>    - Dialog closes automatically <br> 4. User can log in with the new password on next login | P |
| TC1-105 | Logout | Verify that user can successfully log out from the application | 1. Log in to the application with valid credentials <br> 2. Click on the user avatar/profile icon in the top bar <br> 3. Click on the "Sign Out" button in the profile popover <br> 4. A confirmation dialog appears - click "Yes" or "Accept" to confirm logout | 1. Profile popover closes when "Sign Out" is clicked <br> 2. A confirmation dialog appears with: <br>    - Header: "Sign Out" <br>    - Message: "Are you sure you want to sign out?" <br>    - Sign out icon <br>    - "Yes" (danger/red button) and "No" (cancel) options <br> 3. After confirming logout: <br>    - Loading state is shown (if applicable) <br>    - Success toast message appears: "You have been signed out successfully" <br>    - User session is terminated <br>    - User is redirected to the login page or home page <br>    - All authentication tokens are cleared <br>    - User cannot access protected routes without logging in again <br> 4. If user clicks "No" or cancels: <br>    - Confirmation dialog closes <br>    - User remains logged in <br>    - No logout action occurs | P |

## Test Status Legend
- **P** = Pass (Test case is ready for execution)
- **F** = Fail (Test case needs revision or has issues)
- **B** = Blocked (Test case cannot be executed due to dependencies)

## Additional Test Scenarios (Optional)

### TC1-101.1 - Login Page Validation
**Objective**: Verify form validation on login page
**Steps**:
1. Navigate to login page
2. Click "Sign in" without entering any data
3. Enter invalid email format
4. Enter password with less than 6 characters

**Expected Results**:
- Required field errors appear for empty fields
- Email validation error appears for invalid email format
- Password length validation error appears for short passwords
- Submit button is disabled when form is invalid

### TC1-101.2 - Login with Invalid Credentials
**Objective**: Verify error handling for invalid login credentials
**Steps**:
1. Navigate to login page
2. Enter valid email format but incorrect credentials
3. Click "Sign in"

**Expected Results**:
- Error message appears: "Login failed. Please try again." or specific error from server
- User remains on login page
- Form fields are not cleared (except password for security)

### TC1-103.1 - Update Profile with Invalid Email
**Objective**: Verify email validation in profile update
**Steps**:
1. Open Edit Profile dialog
2. Enter invalid email format
3. Click "Update Profile"

**Expected Results**:
- Email validation error appears
- Update is prevented
- Error message is displayed

### TC1-104.1 - Change Password with Incorrect Current Password
**Objective**: Verify error handling for incorrect current password
**Steps**:
1. Open Change Password dialog
2. Enter incorrect current password
3. Enter valid new password and confirmation
4. Click "Change Password"

**Expected Results**:
- Error message appears: "Failed to change password. Please check your current password and try again."
- Dialog remains open
- User can retry with correct current password

