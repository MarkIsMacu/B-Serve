using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_requests_model
    {
        public int requestsID { get; set; }
        public int resident_usersID { get; set; }
        public int request_categoriesID { get; set; }
        public int request_statusesID { get; set; }
        public int admin_usersID { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }

    }
}