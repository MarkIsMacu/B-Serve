using B_Serve.Models.Maps;
using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Context
{
    public class BSRMSContext : DbContext
    {
        static BSRMSContext()
        {
            Database.SetInitializer<BSRMSContext>(null);
        }
        public BSRMSContext() : base("Name=db_bserve") { }

        public virtual DbSet<tbl_account_statuses_model> tbl_account_statuses { get; set; }

        public virtual DbSet<tbl_genders_model> tbl_genders { get; set; }

        public virtual DbSet<tbl_puroks_model> tbl_puroks { get; set; }

        public virtual DbSet<tbl_request_categories_model> tbl_request_categories { get; set; }

        public virtual DbSet<tbl_request_details_model> tbl_request_details { get; set; }

        public virtual DbSet<tbl_request_statuses_model> tbl_request_statuses { get; set; }

        public virtual DbSet<tbl_requests_model> tbl_requests { get; set; }

        public virtual DbSet<tbl_roles_model> tbl_roles { get; set; }

        public virtual DbSet<tbl_system_logs_model> tbl_system_logs { get; set; }

        public virtual DbSet<tbl_users_model> tbl_users { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Configurations.Add(new tbl_account_statuses_map());
            modelBuilder.Configurations.Add(new tbl_genders_map());
            modelBuilder.Configurations.Add(new tbl_puroks_map());
            modelBuilder.Configurations.Add(new tbl_request_categories_map());
            modelBuilder.Configurations.Add(new tbl_request_details_map());
            modelBuilder.Configurations.Add(new tbl_request_statuses_map());
            modelBuilder.Configurations.Add(new tbl_requests_map());
            modelBuilder.Configurations.Add(new tbl_roles_map());
            modelBuilder.Configurations.Add(new tbl_system_logs_map());
            modelBuilder.Configurations.Add(new tbl_users_map());

        }




    }
}