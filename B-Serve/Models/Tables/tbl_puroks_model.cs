using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_puroks_model
    {
        public int puroksID { get; set; }
        public string purokName { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }

    }
}