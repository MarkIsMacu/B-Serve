// Service.js - This file handles all HTTP calls to the C# backend (database)
app.service("BSRMSService", function ($http) {

    // Register a new resident
    this.RegisterUser = function (userData, genderName, purokName) {
        var flatData = {
            firstName: userData.firstName,
            middleName: userData.middleName,
            lastName: userData.lastName,
            contactNumber: userData.contactNumber,
            blkLot: userData.blkLot,
            street: userData.street,
            username: userData.username,
            password: userData.password,
            genderName: genderName,
            purokName: purokName
        };
        return $http({ url: "/BSRMS/RegisterUser", method: "POST", data: flatData });
    };

    // Log in a user
    this.LoginUser = function (username, password) {
        return $http({ url: "/BSRMS/LoginUser", method: "POST", data: { username: username, password: password } });
    };

    // Get all users from the database
    this.GetAllUsers = function () {
        return $http({ url: "/BSRMS/GetAllUsers", method: "GET" });
    };

    // Approve a pending resident
    this.ApproveUser = function (usersID) {
        return $http({ url: "/BSRMS/ApproveUser", method: "POST", data: { usersID: usersID } });
    };

    // Reject and remove a pending resident
    this.RejectUser = function (usersID) {
        return $http({ url: "/BSRMS/RejectUser", method: "POST", data: { usersID: usersID } });
    };

    // Delete a verified resident
    this.DeleteUser = function (usersID) {
        return $http({ url: "/BSRMS/DeleteUser", method: "POST", data: { usersID: usersID } });
    };

    // Get all service requests (for admin)
    this.GetAllRequests = function () {
        return $http({ url: "/BSRMS/GetAllRequests", method: "GET" });
    };

    // Get requests for a specific resident
    this.GetMyRequests = function (username) {
        return $http({ url: "/BSRMS/GetMyRequests", method: "GET", params: { username: username } });
    };

    // Resident submits a new service request
    this.SubmitRequest = function (username, type, message) {
        return $http({ url: "/BSRMS/SubmitRequest", method: "POST", data: { username: username, type: type, message: message } });
    };

    // Admin updates a request status and feedback
    this.UpdateRequest = function (requestsID, status, adminFeedback) {
        return $http({ url: "/BSRMS/UpdateRequest", method: "POST", data: { requestsID: requestsID, status: status, adminFeedback: adminFeedback } });
    };

});