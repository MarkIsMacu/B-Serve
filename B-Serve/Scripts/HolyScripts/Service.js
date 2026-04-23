// Service.js - Dito dumadaan lahat ng request papuntang C# backend at database.
app.service("BSRMSService", function ($http) {

    // Helper para sure na tama yung URL kahit naka-host pa ito sa Visual Studio IIS.
    var baseUrl = window.appBaseUrl || "/";
    if (!baseUrl.endsWith("/")) baseUrl += "/";
    function getApiUrl(endpoint) {
        return baseUrl + endpoint;
    }

    // Para mag-register ng bagong resident sa system.
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
        return $http({ url: getApiUrl("BSRMS/RegisterUser"), method: "POST", data: flatData });
    };

    // Para mag-login ang isang user.
    this.LoginUser = function (username, password) {
        return $http({ url: getApiUrl("BSRMS/LoginUser"), method: "POST", data: { username: username, password: password } });
    };

    // Kukunin natin lahat ng registered users galing database.
    this.GetAllUsers = function () {
        return $http({ url: getApiUrl("BSRMS/GetAllUsers"), method: "GET" });
    };

    // Para i-approve yung pending na resident account.
    this.ApproveUser = function (usersID) {
        return $http({ url: getApiUrl("BSRMS/ApproveUser"), method: "POST", data: { usersID: usersID } });
    };

    // Para i-reject at burahin yung pending na resident account.
    this.RejectUser = function (usersID) {
        return $http({ url: getApiUrl("BSRMS/RejectUser"), method: "POST", data: { usersID: usersID } });
    };

    // Para i-delete ng tuluyan ang isang verified na resident.
    this.DeleteUser = function (usersID) {
        return $http({ url: getApiUrl("BSRMS/DeleteUser"), method: "POST", data: { usersID: usersID } });
    };

    // Kukunin natin lahat ng service requests para makita ni admin.
    this.GetAllRequests = function () {
        return $http({ url: getApiUrl("BSRMS/GetAllRequests"), method: "GET" });
    };

    // Kukunin lang natin yung mga requests na ginawa nung naka-login na user.
    this.GetMyRequests = function (username) {
        return $http({ url: getApiUrl("BSRMS/GetMyRequests"), method: "GET", params: { username: username } });
    };

    // Para makapag-submit ng bagong document request si resident.
    this.SubmitRequest = function (username, type, message) {
        return $http({ url: getApiUrl("BSRMS/SubmitRequest"), method: "POST", data: { username: username, type: type, message: message } });
    };

    // Para ma-update ni admin yung status at makapag-reply siya sa request.
    this.UpdateRequest = function (requestsID, status, adminFeedback) {
        return $http({ url: getApiUrl("BSRMS/UpdateRequest"), method: "POST", data: { requestsID: requestsID, status: status, adminFeedback: adminFeedback } });
    };

    // Para ma-delete ng tuluyan ni admin ang isang request.
    this.DeleteRequest = function (requestsID) {
        return $http({ url: getApiUrl("BSRMS/DeleteRequest"), method: "POST", data: { requestsID: requestsID } });
    };

});