using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_genders_map : EntityTypeConfiguration<tbl_genders_model>
    {
        public tbl_genders_map()
        {
            HasKey(i => i.gendersID);
            ToTable("tbl_genders");
        }
    }
}