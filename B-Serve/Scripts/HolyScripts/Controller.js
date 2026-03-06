app.controller("BSRMSController", function ($scope) {

    // Key for local storage specifically for BSRMS
    var STORAGE_KEY = "BSRMS_UserArray";

    // --- STORAGE LOGIC (Internal to Controller) ---

    // This replaces the need for UserService.getUsers
    $scope.getUsers = function () {
        var data = sessionStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    // This replaces the need for UserService.saveUsers
    $scope.saveUsers = function (users) {
        var textData = JSON.stringify(users);
        sessionStorage.setItem(STORAGE_KEY, textData);
    };

    // Initialize the list of residents
    $scope.userArray = $scope.getUsers();
    $scope.showLogin = false;

    // --- NAVIGATION ---

    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };

    // --- VALIDATION ---

    $scope.isFormValid = function () {
        return ($scope.FName && $scope.MName && $scope.LName &&
            $scope.RegUsername && $scope.RegPassword &&
            $scope.TPhone && $scope.HAddress);
    };

    // --- REGISTRATION LOGIC ---

    $scope.saveUser = function () {
        var newUser = {
            "FirstName": $scope.FName,
            "MiddleName": $scope.MName,
            "LastName": $scope.LName,
            "Username": $scope.RegUsername,
            "Password": $scope.RegPassword,
            "Telephone": $scope.TPhone,
            "HomeAddress": $scope.HAddress
        };

        $scope.userArray.push(newUser);
        $scope.saveUsers($scope.userArray);

        $scope.showLogin = true;
        Swal.fire("Saved!", "Resident registered successfully", "success");
    };

    // --- LOGIN LOGIC ---

    $scope.login = function () {
        var foundUser = null;

        for (var i = 0; i < $scope.userArray.length; i++) {
            var person = $scope.userArray[i];
            if (person.Username === $scope.LoginUser && person.Password === $scope.LoginPass) {
                foundUser = person;
                break;
            }
        }

        if (foundUser != null) {
            Swal.fire("Welcome", "Accessing B-Serve Dashboard...", "success").then(function () {
                $scope.goTo("HomeDashboard");
            });
        } else {
            Swal.fire("Access Denied", "Invalid Username or Password", "error");
        }
    };

    // --- UPDATE & DELETE LOGIC ---

    $scope.editMode = false;
    $scope.editIndex = -1;
    $scope.editData = {};

    $scope.triggerUpdate = function (index) {
        $scope.editMode = true;
        $scope.editIndex = index;
        var person = $scope.userArray[index];
        $scope.editData = {
            FName: person.FirstName,
            MName: person.MiddleName,
            LName: person.LastName,
            User: person.Username,
            Pass: person.Password,
            Phone: person.Telephone,
            Addr: person.HomeAddress
        };
    };

    $scope.saveChanges = function () {
        var person = $scope.userArray[$scope.editIndex];

        person.FirstName = $scope.editData.FName;
        person.MiddleName = $scope.editData.MName;
        person.LastName = $scope.editData.LName;
        person.Username = $scope.editData.User;
        person.Password = $scope.editData.Pass;
        person.Telephone = $scope.editData.Phone;
        person.HomeAddress = $scope.editData.Addr;

        $scope.saveUsers($scope.userArray);
        $scope.editMode = false;

        Swal.fire("Updated!", "Resident data has been updated.", "success");
    };

    $scope.deleteUser = function (index) {
        $scope.userArray.splice(index, 1);
        $scope.saveUsers($scope.userArray);
        Swal.fire("Removed", "Account deleted from session", "warning");
    };

    $scope.deleteData = function () {
        $scope.FName = $scope.MName = $scope.LName = $scope.RegUsername =
            $scope.RegPassword = $scope.TPhone = $scope.HAddress = "";
    };
});