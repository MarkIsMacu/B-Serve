// Ensure your 'app' name matches your layout file
app.controller("BSRMSController", function ($scope, UserService) {



    var STORAGE_KEY = "UserArray";

    // This function opens the safe and gives you the list of users
    $scope.getUsers = function () {
        var data = sessionStorage.getItem(STORAGE_KEY);
        if (data) {
            // Convert the saved text back into a list (array)
            return JSON.parse(data);
        } else {
            // If the safe is empty, return an empty list
            return [];
        }
    };

    // This function takes a list and locks it in the safe
    $scope.saveUsers = function (users) {
        // Convert the list into text so the browser can save it
        var textData = JSON.stringify(users);
        sessionStorage.setItem(STORAGE_KEY, textData);
    };


    $scope.userArray = UserService.getUsers();
    $scope.showLogin = false;

    // NAVIGATION: Updated to match your new file name 'BSRMS'
    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };

    // BARANGAY VALIDATION
    $scope.isFormValid = function () {
        if ($scope.FName && $scope.LName && $scope.Purok &&
            $scope.RegUsername && $scope.RegPassword &&
            $scope.ContactNum && $scope.ResidentID) {
            return true;
        }
        return false;
    };

    // REGISTER RESIDENT
    $scope.saveUser = function () {
        var newUser = {
            "FirstName": $scope.FName,
            "LastName": $scope.LName,
            "Purok": $scope.Purok,
            "Username": $scope.RegUsername,
            "Password": $scope.RegPassword,
            "Contact": $scope.ContactNum,
            "ResidentID": $scope.ResidentID
        };

        $scope.userArray.push(newUser);
        $scope.saveUsers($scope.userArray);

        $scope.showLogin = true;
        Swal.fire("Success!", "Resident Registered to B-Serve", "success");
    };

    // LOGIN LOGIC
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
            Swal.fire("Welcome!", "Accessing B-Serve Dashboard", "success").then(function () {
                $scope.goTo("HomeDashboard");
            });
        } else {
            Swal.fire("Error", "Invalid Credentials", "error");
        }
    };
});