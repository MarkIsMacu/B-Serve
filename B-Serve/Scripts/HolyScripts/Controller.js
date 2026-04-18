// Controller.js - All the actions on every page happen here
app.controller("BSRMSController", function ($scope, BSRMSService) {

    // ================================================================
    // NAVIGATION - go to a different page
    // ================================================================
    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };

    // ================================================================
    // PASSWORD STRENGTH CHECK
    // ================================================================
    $scope.isPasswordStrong = function (password) {
        if (!password || password.length < 8) return false;
        var hasUpper = /[A-Z]/.test(password);
        var hasLower = /[a-z]/.test(password);
        var hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
        return hasUpper && hasLower && hasSpecial;
    };

    // ================================================================
    // REGISTRATION FORM VALIDATION
    // ================================================================
    $scope.isFormValid = function () {
        return $scope.FName && $scope.LName && $scope.Contact &&
               $scope.Gender && $scope.BlkLot && $scope.Street &&
               $scope.Purok && $scope.RegUsername && $scope.RegPassword && $scope.RegConfirmPassword;
    };

    // ================================================================
    // REGISTRATION - save a new resident into the database
    // ================================================================
    $scope.saveUser = function () {
        if ($scope.RegPassword !== $scope.RegConfirmPassword) {
            Swal.fire("Error", "Passwords do not match!", "error");
            return;
        }
        if (!$scope.isPasswordStrong($scope.RegPassword)) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        var userData = {
            firstName: $scope.FName,
            middleName: $scope.MName || "",
            lastName: $scope.LName,
            contactNumber: $scope.Contact,
            blkLot: $scope.BlkLot,
            street: $scope.Street,
            username: $scope.RegUsername,
            password: $scope.RegPassword
        };

        BSRMSService.RegisterUser(userData, $scope.Gender, $scope.Purok).then(function (response) {
            if (response.data.success) {
                Swal.fire({ title: "Registration Submitted!", text: response.data.message, icon: "info", confirmButtonColor: "#1976D2" })
                    .then(function () { $scope.goTo("LogIn"); });
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // ================================================================
    // LOGIN - check credentials then redirect based on role
    // ================================================================
    $scope.login = function () {
        BSRMSService.LoginUser($scope.LoginUser, $scope.LoginPass).then(function (response) {
            if (response.data.success) {
                var user = response.data;

                // Save who is logged in so other pages can use it
                sessionStorage.setItem("LoggedInUser", user.username);
                sessionStorage.setItem("LoggedInRole", user.role);

                if (user.role === "Admin") {
                    $scope.goTo("HomeDashboard");
                } else if (user.role === "Resident") {
                    if (user.status === "Pending") {
                        Swal.fire("Pending", "Your account is still waiting for Admin verification.", "warning");
                    } else if (user.status === "Verified") {
                        Swal.fire("Success", "You are now logged in.", "success")
                            .then(function () { $scope.goTo("ResidentDashboard"); });
                    } else {
                        Swal.fire("Rejected", "Your account has been rejected. Contact the admin.", "error");
                    }
                }
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // ================================================================
    // ADMIN APPROVAL PAGE - load pending residents from database
    // ================================================================
    $scope.userArray = [];

    $scope.loadAllUsers = function () {
        BSRMSService.GetAllUsers().then(function (response) {
            if (response.data.success) {
                $scope.userArray = response.data.data;
            }
        });
    };

    // Call loadAllUsers automatically when page loads (for Approval and Users pages)
    $scope.loadAllUsers();

    // Approve a resident
    $scope.verifyUser = function (user) {
        BSRMSService.ApproveUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Approved!", "Resident can now log in.", "success");
                $scope.loadAllUsers(); // Refresh the list
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // Reject a pending resident
    $scope.rejectUser = function (user) {
        BSRMSService.RejectUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Rejected", "Registration rejected and removed.", "info");
                $scope.loadAllUsers();
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // Delete a verified resident
    $scope.deleteUser = function (user) {
        BSRMSService.DeleteUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Deleted", "Resident record deleted.", "warning");
                $scope.loadAllUsers();
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // ================================================================
    // ADMIN DASHBOARD - count stats for the home dashboard
    // ================================================================
    $scope.getTotalVerifiedResidents = function () {
        var count = 0;
        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Role === "Resident" && $scope.userArray[i].Status === "Verified") count++;
        }
        return count;
    };

    $scope.countRequests = function (statusToFind) {
        var count = 0;
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === statusToFind) count++;
        }
        return count;
    };

    $scope.generatePDFReport = function () { window.print(); };

    // ================================================================
    // ADMIN USERS - manual user form
    // ================================================================
    $scope.showUserForm = false;
    $scope.userEditMode = false;
    $scope.tempUser = {};

    $scope.openAddUserForm = function () {
        $scope.showUserForm = true;
        $scope.userEditMode = false;
        $scope.tempUser = {};
    };

    $scope.triggerEditUser = function (user) {
        $scope.showUserForm = true;
        $scope.userEditMode = true;
        $scope.tempUser = angular.copy(user);
    };

    // Admin adding a new resident manually (uses the same registration endpoint)
    $scope.adminSaveUser = function () {
        if (!$scope.userEditMode && !$scope.isPasswordStrong($scope.tempUser.Password)) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        var userData = {
            firstName: $scope.tempUser.FirstName,
            middleName: $scope.tempUser.MiddleName || "",
            lastName: $scope.tempUser.LastName,
            contactNumber: $scope.tempUser.Contact,
            blkLot: $scope.tempUser.BlkLot,
            street: $scope.tempUser.Street,
            username: $scope.tempUser.Username,
            password: $scope.tempUser.Password
        };

        BSRMSService.RegisterUser(userData, $scope.tempUser.Gender, $scope.tempUser.Purok).then(function (response) {
            if (response.data.success) {
                // After adding, approve them automatically (admin adds are always verified)
                BSRMSService.GetAllUsers().then(function (r) {
                    var addedUser = r.data.data.filter(function(u) { return u.Username === userData.username; })[0];
                    if (addedUser) {
                        BSRMSService.ApproveUser(addedUser.usersID).then(function () {
                            Swal.fire("Added", "Resident added and verified.", "success");
                            $scope.loadAllUsers();
                            $scope.showUserForm = false;
                        });
                    }
                });
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // ================================================================
    // ADMIN REQUESTS - load and manage service requests
    // ================================================================
    $scope.requestArray = [];
    $scope.currentReqFilter = '';

    $scope.setReqFilter = function (status) {
        $scope.currentReqFilter = status;
    };

    $scope.hasFilteredRequests = function () {
        if ($scope.currentReqFilter === '') return $scope.requestArray.length > 0;
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === $scope.currentReqFilter) return true;
        }
        return false;
    };

    $scope.loadAllRequests = function () {
        BSRMSService.GetAllRequests().then(function (response) {
            if (response.data.success) {
                $scope.requestArray = response.data.data;
            }
        });
    };

    // Load automatically for admin requests page
    $scope.loadAllRequests();

    $scope.showReqForm = false;
    $scope.reqEditMode = false;
    $scope.tempReq = {};

    $scope.openAddReqForm = function () {
        $scope.showReqForm = true;
        $scope.reqEditMode = false;
        $scope.tempReq = { Status: "Pending", AdminFeedback: "" };
    };

    $scope.triggerEditRequest = function (req) {
        $scope.showReqForm = true;
        $scope.reqEditMode = true;
        $scope.tempReq = angular.copy(req);
    };

    $scope.adminSaveRequest = function () {
        BSRMSService.UpdateRequest($scope.tempReq.requestsID, $scope.tempReq.Status, $scope.tempReq.AdminFeedback).then(function (response) {
            if (response.data.success) {
                Swal.fire("Updated", "Request updated successfully.", "success");
                $scope.loadAllRequests();
                $scope.showReqForm = false;
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    $scope.deleteRequest = function (req) {
        // Note: No delete endpoint currently - admin manages via status
        Swal.fire("Info", "To remove a request, set its status to Resolved.", "info");
    };

    // ================================================================
    // RESIDENT DASHBOARD - load and submit resident requests
    // ================================================================
    $scope.myRequests = [];

    $scope.loadMyRequests = function () {
        var me = sessionStorage.getItem("LoggedInUser");
        if (!me) return;

        BSRMSService.GetMyRequests(me).then(function (response) {
            if (response.data.success) {
                $scope.myRequests = response.data.data;
            }
        });
    };

    // Resident submits a new request
    $scope.submitRequest = function () {
        var me = sessionStorage.getItem("LoggedInUser");
        BSRMSService.SubmitRequest(me, $scope.ReqType, $scope.ReqMessage).then(function (response) {
            if (response.data.success) {
                Swal.fire("Sent!", "Your request has been submitted.", "success");
                $scope.ReqType = "";
                $scope.ReqMessage = "";
                $scope.loadMyRequests(); // Refresh the list
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // Redundant function kept for compatibility
    $scope.UpsertFunc = function () {};

});