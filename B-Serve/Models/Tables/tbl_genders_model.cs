using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_genders_model
    {
        public int gendersID { get; set; }
        public string genderName { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }

    }
}