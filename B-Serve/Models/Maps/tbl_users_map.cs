using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_users_map : EntityTypeConfiguration<tbl_users_model>
    {
        public tbl_users_map()
        {
            HasKey(i => i.usersID);
            ToTable("tbl_users");
        }
    }
}