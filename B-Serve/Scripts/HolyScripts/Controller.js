app.controller("BSRMSController", function ($scope) {

    // ==========================================================
    // 1. STORAGE SETUP (Using sessionStorage for auto-reset)
    // ==========================================================
    var USER_KEY = "BSRMS_UserArray";
    var REQUEST_KEY = "BSRMS_RequestArray";

    // Gets the users from browser memory
    $scope.getUsers = function () {
        var data = sessionStorage.getItem(USER_KEY);
        if (data) {
            return JSON.parse(data);
        } else {
            return [];
        }
    };

    // Saves the users to browser memory
    $scope.saveUsers = function (users) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(users));
    };

    // Gets the requests from browser memory
    $scope.getRequests = function () {
        var data = sessionStorage.getItem(REQUEST_KEY);
        if (data) {
            return JSON.parse(data);
        } else {
            return [];
        }
    };

    // Saves the requests to browser memory
    $scope.saveRequests = function (requests) {
        sessionStorage.setItem(REQUEST_KEY, JSON.stringify(requests));
    };

    // Load arrays when the page starts
    $scope.userArray = $scope.getUsers();
    $scope.requestArray = $scope.getRequests();

    // Create a Default Admin Account if the array is completely empty
    if ($scope.userArray.length === 0) {
        var defaultAdmin = {
            FirstName: "System",
            LastName: "Admin",
            Username: "admin",
            Password: "123",
            Role: "Admin",
            Status: "Verified"
        };

        $scope.userArray.push(defaultAdmin);
        $scope.saveUsers($scope.userArray);
    }

    // Function to change pages
    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };


    // ==========================================================
    // 2. PUBLIC REGISTRATION & LOGIN
    // ==========================================================

    // Checks if the user filled out all required fields
    $scope.isFormValid = function () {
        if ($scope.FName && $scope.LName && $scope.Contact &&
            $scope.Gender && $scope.BlkLot && $scope.Street &&
            $scope.Purok && $scope.RegUsername && $scope.RegPassword) {
            return true;
        } else {
            return false;
        }
    };

    // Register a new resident
    $scope.saveUser = function () {
        var newUser = {
            FirstName: $scope.FName,
            MiddleName: $scope.MName || "",
            LastName: $scope.LName,
            Contact: $scope.Contact,
            Gender: $scope.Gender,
            BlockLot: $scope.BlkLot,
            Street: $scope.Street,
            Purok: $scope.Purok,
            FullAddress: $scope.BlkLot + " " + $scope.Street + ", " + $scope.Purok,
            Username: $scope.RegUsername,
            Password: $scope.RegPassword,
            Role: "Resident",
            Status: "Pending"
        };

        $scope.userArray.push(newUser);
        $scope.saveUsers($scope.userArray);

        Swal.fire({
            title: "Registration Submitted!",
            text: "Please wait for the confirmation of the admin to verify that you are a resident of this barangay.",
            icon: "info",
            confirmButtonText: "Understood",
            confirmButtonColor: "#1976D2"
        }).then(function () {
            $scope.goTo("Login");
        });
    };

    // Handle user login
    $scope.login = function () {
        var foundUser = null;

        // Search through users to find a match
        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Username === $scope.LoginUser && $scope.userArray[i].Password === $scope.LoginPass) {
                foundUser = $scope.userArray[i];
                break;
            }
        }

        // If a matching user was found
        if (foundUser != null) {

            if (foundUser.Role === "Admin") {
                sessionStorage.setItem("LoggedInUser", foundUser.Username);
                $scope.goTo("HomeDashboard");

            } else if (foundUser.Role === "Resident") {

                if (foundUser.Status === "Pending") {
                    Swal.fire("Verification Pending", "Your account is still waiting for Admin verification. Please try again later.", "warning");

                } else if (foundUser.Status === "Verified") {
                    sessionStorage.setItem("LoggedInUser", foundUser.Username);

                    Swal.fire({
                        title: "Login Successful!",
                        text: "Congratulations, you are now a registered resident of this barangay.",
                        icon: "success",
                        confirmButtonText: "Proceed to Dashboard"
                    }).then(function () {
                        $scope.goTo("ResidentDashboard");
                    });
                }
            }

        } else {
            Swal.fire("Error", "Wrong Username or Password", "error");
        }
    };


    // ==========================================================
    // 3. ADMIN: VERIFY PENDING USERS
    // ==========================================================

    $scope.verifyUser = function (user) {
        var index = $scope.userArray.indexOf(user);

        if (index !== -1) {
            $scope.userArray[index].Status = "Verified";
            $scope.saveUsers($scope.userArray);
            Swal.fire("Verified!", "Resident can now log in.", "success");
        }
    };

    $scope.rejectUser = function (user) {
        var index = $scope.userArray.indexOf(user);

        if (index !== -1) {
            $scope.userArray.splice(index, 1);
            $scope.saveUsers($scope.userArray);
            Swal.fire("Rejected", "Registration removed.", "info");
        }
    };

    // Counts how many verified residents exist for the Dashboard
    $scope.getTotalVerifiedResidents = function () {
        var count = 0;

        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Role === "Resident" && $scope.userArray[i].Status === "Verified") {
                count++;
            }
        }

        return count;
    };


    // ==========================================================
    // 4. ADMIN FULL CRUD: VERIFIED USERS
    // ==========================================================

    // Variables to control the form
    $scope.showUserForm = false;
    $scope.userEditMode = false;
    $scope.editUserIndex = -1;
    $scope.tempUser = {};

    $scope.openAddUserForm = function () {
        $scope.showUserForm = true;
        $scope.userEditMode = false;
        $scope.tempUser = {};
    };

    $scope.triggerEditUser = function (user) {
        $scope.showUserForm = true;
        $scope.userEditMode = true;
        $scope.editUserIndex = $scope.userArray.indexOf(user);
        // Copy data into form so we don't edit the live data directly
        $scope.tempUser = angular.copy(user);
    };

    $scope.adminSaveUser = function () {
        if ($scope.userEditMode == true) {
            // Update existing user
            $scope.userArray[$scope.editUserIndex] = $scope.tempUser;
            Swal.fire("Updated", "Resident updated successfully", "success");
        } else {
            // Add new user
            $scope.tempUser.Role = "Resident";
            $scope.tempUser.Status = "Verified";
            $scope.userArray.push($scope.tempUser);
            Swal.fire("Added", "Resident added successfully", "success");
        }

        $scope.saveUsers($scope.userArray);
        $scope.showUserForm = false;
    };

    $scope.deleteUser = function (user) {
        var index = $scope.userArray.indexOf(user);

        if (index !== -1) {
            $scope.userArray.splice(index, 1);
            $scope.saveUsers($scope.userArray);
            Swal.fire("Deleted", "Resident removed.", "warning");
        }
    };


    // ==========================================================
    // 5. RESIDENT: SUBMIT & VIEW REQUESTS
    // ==========================================================

    $scope.submitRequest = function () {
        var newRequest = {
            Sender: sessionStorage.getItem("LoggedInUser"),
            Type: $scope.ReqType,
            Message: $scope.ReqMessage,
            Status: "Pending"
        };

        $scope.requestArray.push(newRequest);
        $scope.saveRequests($scope.requestArray);

        // Clear the text box after sending
        $scope.ReqMessage = "";

        Swal.fire("Sent!", "Your request has been submitted.", "success");
        $scope.loadMyRequests();
    };

    // Filter requests to show only the logged-in user's requests
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
    // 6. ADMIN FULL CRUD: REQUESTS
    // ==========================================================

    // Variables to control the request form
    $scope.showReqForm = false;
    $scope.reqEditMode = false;
    $scope.editReqIndex = -1;
    $scope.tempReq = {};

    $scope.openAddReqForm = function () {
        $scope.showReqForm = true;
        $scope.reqEditMode = false;
        $scope.tempReq = { Status: "Pending" };
    };

    $scope.triggerEditRequest = function (req) {
        $scope.showReqForm = true;
        $scope.reqEditMode = true;
        $scope.editReqIndex = $scope.requestArray.indexOf(req);
        // Copy data into form
        $scope.tempReq = angular.copy(req);
    };

    $scope.adminSaveRequest = function () {
        if ($scope.reqEditMode == true) {
            // Update existing request
            $scope.requestArray[$scope.editReqIndex] = $scope.tempReq;
            Swal.fire("Updated", "Request updated successfully", "success");
        } else {
            // Add new request manually
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