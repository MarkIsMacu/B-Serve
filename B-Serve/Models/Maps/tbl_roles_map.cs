using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_roles_map : EntityTypeConfiguration<tbl_roles_model>
    {
        public tbl_roles_map()
        {
            HasKey(i => i.rolesID);
            ToTable("tbl_roles");
        }
    }
}