using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_users_model
    {
        public int usersID { get; set; }
        public string firstName { get; set; }
        public string middleName { get; set; }
        public string lastName { get; set; }
        public string contactNumber { get; set; }
        public string blkLot { get; set; }
        public string street { get; set; }
        public string username { get; set; }
        public int gendersID { get; set; }
        public int puroksID { get; set; }
        public int rolesID { get; set; }
        public int account_statusesID { get; set; }
        public string password { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }
    }
}