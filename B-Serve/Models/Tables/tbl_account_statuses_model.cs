using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_account_statuses_model
    {
        public int account_statusesID { get; set; }
        public string statusName { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }

    }
}