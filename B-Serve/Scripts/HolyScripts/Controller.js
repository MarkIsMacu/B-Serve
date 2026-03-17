app.controller("BSRMSController", function ($scope) {

    // ==========================================================
    // 1. STORAGE SETUP 
    // ==========================================================
    var USER_KEY = "BSRMS_UserArray";
    var REQUEST_KEY = "BSRMS_RequestArray";

    $scope.getUsers = function () {
        var data = sessionStorage.getItem(USER_KEY);
        if (data) { return JSON.parse(data); }
        else { return []; }
    };

    $scope.saveUsers = function (users) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(users));
    };

    $scope.getRequests = function () {
        var data = sessionStorage.getItem(REQUEST_KEY);
        if (data) { return JSON.parse(data); }
        else { return []; }
    };

    $scope.saveRequests = function (requests) {
        sessionStorage.setItem(REQUEST_KEY, JSON.stringify(requests));
    };

    $scope.userArray = $scope.getUsers();
    $scope.requestArray = $scope.getRequests();

    if ($scope.userArray.length === 0) {
        var defaultAdmin = {
            FirstName: "System", LastName: "Admin", Username: "admin", Password: "123", Role: "Admin", Status: "Verified"
        };
        $scope.userArray.push(defaultAdmin);
        $scope.saveUsers($scope.userArray);
    }

    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };

    // ==========================================================
    // 2. HELPER FUNCTIONS
    // ==========================================================

    $scope.isPasswordStrong = function (password) {
        if (!password) { return false; }
        if (password.length < 8) { return false; }

        var hasUpper = /[A-Z]/.test(password);
        var hasLower = /[a-z]/.test(password);
        var hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

        if (hasUpper == true && hasLower == true && hasSpecial == true) {
            return true;
        } else {
            return false;
        }
    };

    $scope.changeUserStatus = function (user, action, successMessage, iconType) {
        var index = $scope.userArray.indexOf(user);
        if (index !== -1) {
            if (action === "Delete") {
                $scope.userArray.splice(index, 1);
            } else {
                $scope.userArray[index].Status = action;
            }
            $scope.saveUsers($scope.userArray);
            Swal.fire("Success", successMessage, iconType);
        }
    };

    $scope.countRequests = function (statusToFind) {
        var count = 0;
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === statusToFind) {
                count++;
            }
        }
        return count;
    };

    $scope.generatePDFReport = function () {
        window.print();
    };

    // ==========================================================
    // 3. PUBLIC REGISTRATION & LOGIN
    // ==========================================================

    $scope.isFormValid = function () {
        if ($scope.FName && $scope.LName && $scope.Contact &&
            $scope.Gender && $scope.BlkLot && $scope.Street &&
            $scope.Purok && $scope.RegUsername && $scope.RegPassword && $scope.RegConfirmPassword) {
            return true;
        } else {
            return false;
        }
    };

    $scope.saveUser = function () {
        if ($scope.RegPassword !== $scope.RegConfirmPassword) {
            Swal.fire("Error", "Passwords do not match!", "error");
            return;
        }
        if ($scope.isPasswordStrong($scope.RegPassword) == false) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        var newUser = {
            FirstName: $scope.FName, MiddleName: $scope.MName || "", LastName: $scope.LName, Contact: $scope.Contact, Gender: $scope.Gender,
            BlkLot: $scope.BlkLot, Street: $scope.Street, Purok: $scope.Purok, FullAddress: $scope.BlkLot + " " + $scope.Street + ", " + $scope.Purok,
            Username: $scope.RegUsername, Password: $scope.RegPassword, Role: "Resident", Status: "Pending"
        };

        $scope.userArray.push(newUser);
        $scope.saveUsers($scope.userArray);

        Swal.fire({
            title: "Registration Submitted!", text: "Please wait for admin verification.", icon: "info", confirmButtonColor: "#1976D2"
        }).then(function () {
            $scope.goTo("LogIn");
        });
    };

    $scope.login = function () {
        var foundUser = null;
        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Username === $scope.LoginUser && $scope.userArray[i].Password === $scope.LoginPass) {
                foundUser = $scope.userArray[i];
                break;
            }
        }

        if (foundUser != null) {
            if (foundUser.Role === "Admin") {
                sessionStorage.setItem("LoggedInUser", foundUser.Username);
                $scope.goTo("HomeDashboard");
            } else if (foundUser.Role === "Resident") {
                if (foundUser.Status === "Pending") {
                    Swal.fire("Pending", "Your account is still waiting for Admin verification.", "warning");
                } else if (foundUser.Status === "Verified") {
                    sessionStorage.setItem("LoggedInUser", foundUser.Username);
                    Swal.fire("Success", "You are now logged in.", "success").then(function () {
                        $scope.goTo("ResidentDashboard");
                    });
                }
            }
        } else {
            Swal.fire("Error", "Wrong Username or Password", "error");
        }
    };

    // ==========================================================
    // 4. ADMIN APPROVALS & USERS CRUD
    // ==========================================================

    $scope.verifyUser = function (user) { $scope.changeUserStatus(user, "Verified", "Resident can now log in.", "success"); };
    $scope.rejectUser = function (user) { $scope.changeUserStatus(user, "Delete", "Registration rejected and removed.", "info"); };
    $scope.deleteUser = function (user) { $scope.changeUserStatus(user, "Delete", "Resident record deleted.", "warning"); };

    $scope.getTotalVerifiedResidents = function () {
        var count = 0;
        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Role === "Resident" && $scope.userArray[i].Status === "Verified") {
                count++;
            }
        }
        return count;
    };

    $scope.showUserForm = false;
    $scope.userEditMode = false;
    $scope.editUserIndex = -1;
    $scope.tempUser = {};

    $scope.openAddUserForm = function () {
        $scope.showUserForm = true; $scope.userEditMode = false; $scope.tempUser = {};
    };

    $scope.triggerEditUser = function (user) {
        $scope.showUserForm = true; $scope.userEditMode = true;
        $scope.editUserIndex = $scope.userArray.indexOf(user);
        $scope.tempUser = angular.copy(user);
    };

    $scope.adminSaveUser = function () {
        if ($scope.userEditMode == false && $scope.isPasswordStrong($scope.tempUser.Password) == false) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        $scope.tempUser.FullAddress = $scope.tempUser.BlkLot + " " + $scope.tempUser.Street + ", " + $scope.tempUser.Purok;

        if ($scope.userEditMode == true) {
            $scope.userArray[$scope.editUserIndex] = $scope.tempUser;
            Swal.fire("Updated", "Resident updated successfully", "success");
        } else {
            $scope.tempUser.Role = "Resident";
            $scope.tempUser.Status = "Verified";
            $scope.userArray.push($scope.tempUser);
            Swal.fire("Added", "Resident added successfully", "success");
        }

        $scope.saveUsers($scope.userArray);
        $scope.showUserForm = false;
    };

    // ==========================================================
    // 5. RESIDENT REQUESTS
    // ==========================================================

    $scope.submitRequest = function () {
        var newRequest = {
            Sender: sessionStorage.getItem("LoggedInUser"),
            Type: $scope.ReqType,
            Message: $scope.ReqMessage,
            Status: "Pending",
            AdminFeedback: ""
        };

        $scope.requestArray.push(newRequest);
        $scope.saveRequests($scope.requestArray);
        $scope.ReqMessage = "";
        Swal.fire("Sent!", "Your request has been submitted.", "success");
        $scope.loadMyRequests();
    };

    $scope.myRequests = [];
    $scope.loadMyRequests = function () {
        var me = sessionStorage.getItem("LoggedInUser");
        $scope.myRequests = [];
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Sender === me) {
                $scope.myRequests.push($scope.requestArray[i]);
            }
        }
    };

    // ==========================================================
    // 6. ADMIN REQUESTS & FILTERING
    // ==========================================================

    $scope.currentReqFilter = '';
    $scope.setReqFilter = function (status) {
        $scope.currentReqFilter = status;
    };

    // Safe boolean checker for the empty state UI
    $scope.hasFilteredRequests = function () {
        if ($scope.currentReqFilter === '') {
            if ($scope.requestArray.length > 0) { return true; }
            else { return false; }
        }

        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === $scope.currentReqFilter) {
                return true;
            }
        }
        return false;
    };

    $scope.showReqForm = false;
    $scope.reqEditMode = false;
    $scope.editReqIndex = -1;
    $scope.tempReq = {};

    $scope.openAddReqForm = function () {
        $scope.showReqForm = true; $scope.reqEditMode = false; $scope.tempReq = { Status: "Pending", AdminFeedback: "" };
    };

    $scope.triggerEditRequest = function (req) {
        $scope.showReqForm = true; $scope.reqEditMode = true;
        $scope.editReqIndex = $scope.requestArray.indexOf(req);
        $scope.tempReq = angular.copy(req);
    };

    $scope.adminSaveRequest = function () {
        if ($scope.reqEditMode == true) {
            $scope.requestArray[$scope.editReqIndex] = $scope.tempReq;
            Swal.fire("Updated", "Request updated successfully", "success");
        } else {
            $scope.tempReq.Sender = "Admin (Manual Entry)";
            $scope.requestArray.push($scope.tempReq);
            Swal.fire("Added", "Request added successfully", "success");
        }
        $scope.saveRequests($scope.requestArray);
        $scope.showReqForm = false;
    };

    $scope.deleteRequest = function (req) {
        var index = $scope.requestArray.indexOf(req);
        if (index !== -1) {
            $scope.requestArray.splice(index, 1);
            $scope.saveRequests($scope.requestArray);
            Swal.fire("Deleted", "Request removed.", "warning");
        }
    };

});