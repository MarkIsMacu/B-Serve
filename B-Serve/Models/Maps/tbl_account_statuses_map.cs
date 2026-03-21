using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_account_statuses_map : EntityTypeConfiguration<tbl_account_statuses_model>
    {
        public tbl_account_statuses_map() 
        {
            HasKey(i => i.account_statusesID);
            ToTable("tbl_account_statuses");
        }
    }
}