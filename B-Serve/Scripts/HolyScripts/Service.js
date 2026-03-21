app.service("UserService", function ($http) { // 1. Injected $http here

    this.UpsertService = function (accountData) { // Optional: Added a parameter so you can pass data

        var response = $http({                  // 2. Fixed the bracket syntax here
            url: "/BSRMS/UpsertAccount_Status",
            method: "POST",                     // Best practice: capitalize POST
            data: accountData                   // Optional: Send the data to your C# backend
        });

        return response;                        // 3. Always return the response so your Controller can use .then()
    };

});