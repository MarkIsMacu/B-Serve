using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_system_logs_model
    {
        public int system_logsID { get; set; }
        public int usersID { get; set; }
        public string actionType { get; set; }
        public string errorMessage { get; set; }
        public DateTime createdAt { get; set; }
    }
}