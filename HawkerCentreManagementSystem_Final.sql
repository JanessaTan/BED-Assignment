/*
  HawkerHub final local-development database
  Source of truth: backend files in BEDNewDatabase.zip (main-branch export)

  IMPORTANT
  ---------
  1. Run this script using a SQL Server administrator account.
  2. If the server login HawkerHubAppLogin does not already exist, replace
     CHANGE_ME_LOCAL_ONLY below with a strong password chosen on your computer.
  3. Do not commit or share a copy containing your real local password.
  4. This is a clean-install script, not a migration for an older HCMS database.
*/

USE [master];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @AppLoginPassword NVARCHAR(128) = N'CHANGE_ME_LOCAL_ONLY';

IF NOT EXISTS (
    SELECT 1
    FROM sys.server_principals
    WHERE name = N'HawkerHubAppLogin'
)
BEGIN
    IF @AppLoginPassword = N'CHANGE_ME_LOCAL_ONLY'
       OR LEN(@AppLoginPassword) < 12
    BEGIN
        THROW 51000,
          'Set @AppLoginPassword to a strong local password (12+ characters) before the first run.',
          1;
    END;

    DECLARE @CreateLoginSql NVARCHAR(MAX) =
        N'CREATE LOGIN [HawkerHubAppLogin] WITH PASSWORD = N'''
        + REPLACE(@AppLoginPassword, N'''', N'''''')
        + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';

    EXEC sys.sp_executesql @CreateLoginSql;
END;
GO

IF DB_ID(N'HawkerCentreManagementSystem') IS NULL
BEGIN
    CREATE DATABASE [HawkerCentreManagementSystem]
      COLLATE SQL_Latin1_General_CP1_CI_AS;
END;
GO

USE [HawkerCentreManagementSystem];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* 
To reset the tables:
Uncomment the drop table queries and run them multiple times, 
until you get the message "Commands completed successfully".
Then run the whole sql file to reset the database tables. 
Remember to re-comment these afterwards if you want new values to stay! 
*/
--DROP TABLE IF EXISTS dbo.complaints;
--DROP TABLE IF EXISTS dbo.crowd_updates;
--DROP TABLE IF EXISTS dbo.cuisines;
--DROP TABLE IF EXISTS dbo.Customer;
--DROP TABLE IF EXISTS dbo.CustOrder;
--DROP TABLE IF EXISTS dbo.Feedback;
--DROP TABLE IF EXISTS dbo.FoodStall;
--DROP TABLE IF EXISTS dbo.hawker_centres;
--DROP TABLE IF EXISTS dbo.Inspection;
--DROP TABLE IF EXISTS dbo.InspectionRemark;
--DROP TABLE IF EXISTS dbo.inspections;
--DROP TABLE IF EXISTS dbo.Likes;
--DROP TABLE IF EXISTS dbo.menu_add_ons;
--DROP TABLE IF EXISTS dbo.menu_item_cuisines;
--DROP TABLE IF EXISTS dbo.menu_item_likes;
--DROP TABLE IF EXISTS dbo.menu_items;
--DROP TABLE IF EXISTS dbo.MenuItem;
--DROP TABLE IF EXISTS dbo.NEA_Officer;
--DROP TABLE IF EXISTS dbo.operator_centres;
--DROP TABLE IF EXISTS dbo.OrderItem;
--DROP TABLE IF EXISTS dbo.promotion_menu_items;
--DROP TABLE IF EXISTS dbo.promotions;
--DROP TABLE IF EXISTS dbo.rental_agreements;
--DROP TABLE IF EXISTS dbo.RentalAgreement;
--DROP TABLE IF EXISTS dbo.roles;
--DROP TABLE IF EXISTS dbo.SchemaMetadata;
--DROP TABLE IF EXISTS dbo.stall_cuisines;
--DROP TABLE IF EXISTS dbo.stall_operations;
--DROP TABLE IF EXISTS dbo.stall_owners;
--DROP TABLE IF EXISTS dbo.StallOwner;
--DROP TABLE IF EXISTS dbo.stalls;
--DROP TABLE IF EXISTS dbo.UserAccount;
--DROP TABLE IF EXISTS dbo.UserRole;
--DROP TABLE IF EXISTS dbo.users;
--DROP TABLE IF EXISTS #UserSeed;
--DROP TABLE IF EXISTS #CentreSeed;
--DROP TABLE IF EXISTS #StallSeed;
--DROP TABLE IF EXISTS #OperatorCentreSeed;
--DROP TABLE IF EXISTS #MenuSeed;
--DROP TABLE IF EXISTS #LikeSeed;
--DROP TABLE IF EXISTS #AddOnSeed;
--DROP TABLE IF EXISTS #PromotionSeed;
--DROP TABLE IF EXISTS #PromotionItemSeed;
--DROP TABLE IF EXISTS #CrowdSeed;
--DROP TABLE IF EXISTS #InspectionSeed;
--DROP TABLE IF EXISTS #ComplaintSeed;
--DROP TABLE IF EXISTS #FeedbackSeed;
--GO

/* Refuse to merge this clean schema into an unrelated older database. */
IF OBJECT_ID(N'dbo.SchemaMetadata', N'U') IS NULL
   AND EXISTS (
       SELECT 1
       FROM sys.tables
       WHERE schema_id = SCHEMA_ID(N'dbo')
   )
BEGIN
    THROW 51001,
      'The database already contains an older or unknown schema. Back it up, remove/rename it, then run this clean-install script again.',
      1;
END;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* ================================================================
       Schema marker
       ================================================================ */
    IF OBJECT_ID(N'dbo.SchemaMetadata', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.SchemaMetadata (
            schema_name       NVARCHAR(100) NOT NULL,
            schema_version    NVARCHAR(20)  NOT NULL,
            installed_at      DATETIME2(0)  NOT NULL
                CONSTRAINT DF_SchemaMetadata_InstalledAt
                DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_SchemaMetadata PRIMARY KEY (schema_name)
        );
    END;

    MERGE dbo.SchemaMetadata AS target
    USING (VALUES (N'HawkerHubFinal', N'1.0.0'))
      AS source(schema_name, schema_version)
      ON target.schema_name = source.schema_name
    WHEN MATCHED THEN
      UPDATE SET schema_version = source.schema_version
    WHEN NOT MATCHED THEN
      INSERT (schema_name, schema_version)
      VALUES (source.schema_name, source.schema_version);

    /* ================================================================
       Normalized schema used by the final account/stall/menu code
       ================================================================ */
    IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.roles (
            role_id       INT IDENTITY(1,1) NOT NULL,
            role_name     NVARCHAR(40) NOT NULL,
            created_at    DATETIME2(0) NOT NULL
                CONSTRAINT DF_roles_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_roles PRIMARY KEY (role_id),
            CONSTRAINT UQ_roles_role_name UNIQUE (role_name)
        );
    END;

    IF OBJECT_ID(N'dbo.users', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.users (
            user_id           INT IDENTITY(1,1) NOT NULL,
            role_id           INT NOT NULL,
            full_name         NVARCHAR(120) NOT NULL,
            email             NVARCHAR(254) NOT NULL,
            email_normalized  NVARCHAR(254) NOT NULL,
            password_hash     NVARCHAR(100) NOT NULL,
            phone             VARCHAR(8) NULL,
            account_status    VARCHAR(20) NOT NULL
                CONSTRAINT DF_users_account_status DEFAULT ('Active'),
            created_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
            updated_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_users PRIMARY KEY (user_id),
            CONSTRAINT FK_users_roles FOREIGN KEY (role_id)
                REFERENCES dbo.roles(role_id),
            CONSTRAINT UQ_users_email_normalized UNIQUE (email_normalized),
            CONSTRAINT CK_users_account_status
                CHECK (account_status IN ('Active', 'Deactivated', 'Suspended')),
            CONSTRAINT CK_users_phone
                CHECK (phone IS NULL OR phone LIKE '[689][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
        );
        CREATE INDEX IX_users_role_id ON dbo.users(role_id);
        CREATE INDEX IX_users_full_name ON dbo.users(full_name);
    END;

    IF OBJECT_ID(N'dbo.hawker_centres', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.hawker_centres (
            centre_id       INT IDENTITY(1,1) NOT NULL,
            name            NVARCHAR(150) NOT NULL,
            town            NVARCHAR(80) NOT NULL,
            address         NVARCHAR(250) NOT NULL,
            nearest_mrt     NVARCHAR(100) NULL,
            opening_hours   NVARCHAR(120) NULL,
            description     NVARCHAR(500) NULL,
            is_active       BIT NOT NULL
                CONSTRAINT DF_hawker_centres_is_active DEFAULT (1),
            created_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_hawker_centres_created_at DEFAULT SYSUTCDATETIME(),
            updated_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_hawker_centres_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_hawker_centres PRIMARY KEY (centre_id),
            CONSTRAINT UQ_hawker_centres_address UNIQUE (address)
        );
        CREATE INDEX IX_hawker_centres_name ON dbo.hawker_centres(name);
        CREATE INDEX IX_hawker_centres_town ON dbo.hawker_centres(town);
    END;

    IF OBJECT_ID(N'dbo.cuisines', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.cuisines (
            cuisine_id   INT IDENTITY(1,1) NOT NULL,
            name         NVARCHAR(80) NOT NULL,
            created_at   DATETIME2(0) NOT NULL
                CONSTRAINT DF_cuisines_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_cuisines PRIMARY KEY (cuisine_id),
            CONSTRAINT UQ_cuisines_name UNIQUE (name)
        );
    END;

    IF OBJECT_ID(N'dbo.stalls', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.stalls (
            stall_id        INT IDENTITY(1,1) NOT NULL,
            centre_id       INT NOT NULL,
            name            NVARCHAR(150) NOT NULL,
            unit_number     NVARCHAR(20) NOT NULL,
            description     NVARCHAR(500) NULL,
            opening_hours   NVARCHAR(120) NULL,
            is_active       BIT NOT NULL
                CONSTRAINT DF_stalls_is_active DEFAULT (1),
            created_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_stalls_created_at DEFAULT SYSUTCDATETIME(),
            updated_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_stalls_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_stalls PRIMARY KEY (stall_id),
            CONSTRAINT FK_stalls_hawker_centres FOREIGN KEY (centre_id)
                REFERENCES dbo.hawker_centres(centre_id),
            CONSTRAINT UQ_stalls_centre_unit UNIQUE (centre_id, unit_number)
        );
        CREATE INDEX IX_stalls_centre_active
            ON dbo.stalls(centre_id, is_active);
        CREATE INDEX IX_stalls_name ON dbo.stalls(name);
    END;

    IF OBJECT_ID(N'dbo.stall_owners', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.stall_owners (
            stall_id     INT NOT NULL,
            vendor_id    INT NOT NULL,
            start_date   DATE NOT NULL,
            end_date     DATE NULL,
            created_at   DATETIME2(0) NOT NULL
                CONSTRAINT DF_stall_owners_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_stall_owners
                PRIMARY KEY (stall_id, vendor_id, start_date),
            CONSTRAINT FK_stall_owners_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT FK_stall_owners_users FOREIGN KEY (vendor_id)
                REFERENCES dbo.users(user_id),
            CONSTRAINT CK_stall_owners_dates
                CHECK (end_date IS NULL OR end_date >= start_date)
        );
        CREATE INDEX IX_stall_owners_vendor_dates
            ON dbo.stall_owners(vendor_id, end_date, start_date DESC);
    END;

    IF OBJECT_ID(N'dbo.operator_centres', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.operator_centres (
            user_id      INT NOT NULL,
            centre_id    INT NOT NULL,
            assigned_at  DATETIME2(0) NOT NULL
                CONSTRAINT DF_operator_centres_assigned_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_operator_centres PRIMARY KEY (user_id, centre_id),
            CONSTRAINT FK_operator_centres_users FOREIGN KEY (user_id)
                REFERENCES dbo.users(user_id),
            CONSTRAINT FK_operator_centres_hawker_centres FOREIGN KEY (centre_id)
                REFERENCES dbo.hawker_centres(centre_id)
        );
        CREATE INDEX IX_operator_centres_centre_id
            ON dbo.operator_centres(centre_id);
    END;

    IF OBJECT_ID(N'dbo.stall_cuisines', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.stall_cuisines (
            stall_id     INT NOT NULL,
            cuisine_id   INT NOT NULL,
            is_primary   BIT NOT NULL
                CONSTRAINT DF_stall_cuisines_is_primary DEFAULT (0),
            CONSTRAINT PK_stall_cuisines PRIMARY KEY (stall_id, cuisine_id),
            CONSTRAINT FK_stall_cuisines_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id) ON DELETE CASCADE,
            CONSTRAINT FK_stall_cuisines_cuisines FOREIGN KEY (cuisine_id)
                REFERENCES dbo.cuisines(cuisine_id) ON DELETE CASCADE
        );
        CREATE INDEX IX_stall_cuisines_cuisine_id
            ON dbo.stall_cuisines(cuisine_id, stall_id);
    END;

    IF OBJECT_ID(N'dbo.inspections', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.inspections (
            inspection_id     INT IDENTITY(1,1) NOT NULL,
            stall_id          INT NOT NULL,
            inspection_date   DATE NOT NULL,
            grade             CHAR(1) NULL,
            score             DECIMAL(5,2) NULL,
            status            VARCHAR(20) NOT NULL
                CONSTRAINT DF_inspections_status DEFAULT ('Completed'),
            remarks           NVARCHAR(500) NULL,
            valid_until       DATE NULL,
            created_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_inspections_created_at DEFAULT SYSUTCDATETIME(),
            updated_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_inspections_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_inspections PRIMARY KEY (inspection_id),
            CONSTRAINT FK_inspections_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT CK_inspections_grade
                CHECK (grade IS NULL OR grade IN ('A', 'B', 'C', 'D')),
            CONSTRAINT CK_inspections_score
                CHECK (score IS NULL OR score BETWEEN 0 AND 100),
            CONSTRAINT CK_inspections_status
                CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled'))
        );
        CREATE INDEX IX_inspections_stall_latest
            ON dbo.inspections(stall_id, status, inspection_date DESC, inspection_id DESC);
    END;

    IF OBJECT_ID(N'dbo.crowd_updates', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.crowd_updates (
            crowd_update_id   BIGINT IDENTITY(1,1) NOT NULL,
            centre_id         INT NOT NULL,
            percentage        TINYINT NOT NULL,
            crowd_label       VARCHAR(20) NOT NULL,
            estimated_seats   INT NULL,
            updated_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_crowd_updates_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_crowd_updates PRIMARY KEY (crowd_update_id),
            CONSTRAINT FK_crowd_updates_hawker_centres FOREIGN KEY (centre_id)
                REFERENCES dbo.hawker_centres(centre_id),
            CONSTRAINT CK_crowd_updates_percentage CHECK (percentage BETWEEN 0 AND 100),
            CONSTRAINT CK_crowd_updates_label
                CHECK (crowd_label IN ('Low', 'Moderate', 'High', 'Very High')),
            CONSTRAINT CK_crowd_updates_seats
                CHECK (estimated_seats IS NULL OR estimated_seats >= 0)
        );
        CREATE INDEX IX_crowd_updates_centre_latest
            ON dbo.crowd_updates(centre_id, updated_at DESC);
    END;

    IF OBJECT_ID(N'dbo.menu_items', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.menu_items (
            menu_item_id          INT IDENTITY(1,1) NOT NULL,
            stall_id              INT NOT NULL,
            name                  NVARCHAR(150) NOT NULL,
            category              NVARCHAR(60) NOT NULL,
            description           NVARCHAR(600) NOT NULL,
            price                 DECIMAL(10,2) NOT NULL,
            preparation_minutes   INT NOT NULL,
            is_available          BIT NOT NULL
                CONSTRAINT DF_menu_items_is_available DEFAULT (1),
            created_at            DATETIME2(0) NOT NULL
                CONSTRAINT DF_menu_items_created_at DEFAULT SYSUTCDATETIME(),
            updated_at            DATETIME2(0) NOT NULL
                CONSTRAINT DF_menu_items_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_menu_items PRIMARY KEY (menu_item_id),
            CONSTRAINT FK_menu_items_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT CK_menu_items_price CHECK (price > 0 AND price <= 10000),
            CONSTRAINT CK_menu_items_preparation
                CHECK (preparation_minutes BETWEEN 1 AND 240)
        );
        CREATE INDEX IX_menu_items_stall_available
            ON dbo.menu_items(stall_id, is_available);
        CREATE INDEX IX_menu_items_name ON dbo.menu_items(name);
        CREATE INDEX IX_menu_items_category ON dbo.menu_items(category);
    END;

    IF OBJECT_ID(N'dbo.menu_item_cuisines', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.menu_item_cuisines (
            menu_item_id   INT NOT NULL,
            cuisine_id     INT NOT NULL,
            CONSTRAINT PK_menu_item_cuisines
                PRIMARY KEY (menu_item_id, cuisine_id),
            CONSTRAINT FK_menu_item_cuisines_menu_items
                FOREIGN KEY (menu_item_id)
                REFERENCES dbo.menu_items(menu_item_id) ON DELETE CASCADE,
            CONSTRAINT FK_menu_item_cuisines_cuisines
                FOREIGN KEY (cuisine_id)
                REFERENCES dbo.cuisines(cuisine_id) ON DELETE CASCADE
        );
        CREATE INDEX IX_menu_item_cuisines_cuisine
            ON dbo.menu_item_cuisines(cuisine_id, menu_item_id);
    END;

    IF OBJECT_ID(N'dbo.menu_add_ons', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.menu_add_ons (
            add_on_id       INT IDENTITY(1,1) NOT NULL,
            menu_item_id    INT NOT NULL,
            name            NVARCHAR(100) NOT NULL,
            price           DECIMAL(10,2) NOT NULL,
            is_available    BIT NOT NULL
                CONSTRAINT DF_menu_add_ons_is_available DEFAULT (1),
            created_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_menu_add_ons_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_menu_add_ons PRIMARY KEY (add_on_id),
            CONSTRAINT FK_menu_add_ons_menu_items FOREIGN KEY (menu_item_id)
                REFERENCES dbo.menu_items(menu_item_id) ON DELETE CASCADE,
            CONSTRAINT CK_menu_add_ons_price CHECK (price BETWEEN 0 AND 1000),
            CONSTRAINT UQ_menu_add_ons_item_name UNIQUE (menu_item_id, name)
        );
    END;

    IF OBJECT_ID(N'dbo.menu_item_likes', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.menu_item_likes (
            user_id        INT NOT NULL,
            menu_item_id   INT NOT NULL,
            created_at     DATETIME2(0) NOT NULL
                CONSTRAINT DF_menu_item_likes_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_menu_item_likes PRIMARY KEY (user_id, menu_item_id),
            CONSTRAINT FK_menu_item_likes_users FOREIGN KEY (user_id)
                REFERENCES dbo.users(user_id),
            CONSTRAINT FK_menu_item_likes_menu_items FOREIGN KEY (menu_item_id)
                REFERENCES dbo.menu_items(menu_item_id) ON DELETE CASCADE
        );
        CREATE INDEX IX_menu_item_likes_menu_item
            ON dbo.menu_item_likes(menu_item_id);
    END;

    IF OBJECT_ID(N'dbo.promotions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.promotions (
            promotion_id    INT IDENTITY(1,1) NOT NULL,
            stall_id        INT NOT NULL,
            name            NVARCHAR(150) NOT NULL,
            description     NVARCHAR(500) NOT NULL,
            discount_type   VARCHAR(12) NOT NULL,
            discount_value  DECIMAL(10,2) NOT NULL,
            start_date      DATE NOT NULL,
            end_date        DATE NOT NULL,
            is_active       BIT NOT NULL
                CONSTRAINT DF_promotions_is_active DEFAULT (1),
            created_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_promotions_created_at DEFAULT SYSUTCDATETIME(),
            updated_at      DATETIME2(0) NOT NULL
                CONSTRAINT DF_promotions_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_promotions PRIMARY KEY (promotion_id),
            CONSTRAINT FK_promotions_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT CK_promotions_type
                CHECK (discount_type IN ('Fixed', 'Percentage')),
            CONSTRAINT CK_promotions_value CHECK (discount_value > 0),
            CONSTRAINT CK_promotions_percentage
                CHECK (discount_type <> 'Percentage' OR discount_value <= 100),
            CONSTRAINT CK_promotions_dates CHECK (end_date >= start_date)
        );
        CREATE INDEX IX_promotions_stall_dates
            ON dbo.promotions(stall_id, is_active, start_date, end_date);
    END;

    IF OBJECT_ID(N'dbo.promotion_menu_items', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.promotion_menu_items (
            promotion_id   INT NOT NULL,
            menu_item_id   INT NOT NULL,
            CONSTRAINT PK_promotion_menu_items
                PRIMARY KEY (promotion_id, menu_item_id),
            CONSTRAINT FK_promotion_menu_items_promotions
                FOREIGN KEY (promotion_id)
                REFERENCES dbo.promotions(promotion_id) ON DELETE CASCADE,
            CONSTRAINT FK_promotion_menu_items_menu_items
                FOREIGN KEY (menu_item_id)
                REFERENCES dbo.menu_items(menu_item_id)
        );
        CREATE INDEX IX_promotion_menu_items_menu_item
            ON dbo.promotion_menu_items(menu_item_id);
    END;

    IF OBJECT_ID(N'dbo.stall_operations', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.stall_operations (
            stall_id             INT NOT NULL,
            operational_status   VARCHAR(30) NOT NULL
                CONSTRAINT DF_stall_operations_status DEFAULT ('Open'),
            maintenance_note     NVARCHAR(250) NULL,
            updated_by           INT NULL,
            updated_at           DATETIME2(0) NOT NULL
                CONSTRAINT DF_stall_operations_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_stall_operations PRIMARY KEY (stall_id),
            CONSTRAINT FK_stall_operations_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT FK_stall_operations_users FOREIGN KEY (updated_by)
                REFERENCES dbo.users(user_id),
            CONSTRAINT CK_stall_operations_status
                CHECK (operational_status IN ('Open', 'Closed', 'Maintenance', 'Temporarily Closed'))
        );
    END;

    IF OBJECT_ID(N'dbo.rental_agreements', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.rental_agreements (
            agreement_id      INT IDENTITY(1,1) NOT NULL,
            stall_id          INT NOT NULL,
            vendor_id         INT NULL,
            start_date        DATE NOT NULL,
            end_date          DATE NOT NULL,
            monthly_rent      DECIMAL(12,2) NOT NULL,
            terms             NVARCHAR(1000) NULL,
            status            VARCHAR(20) NOT NULL
                CONSTRAINT DF_rental_agreements_status DEFAULT ('Active'),
            created_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_rental_agreements_created_at DEFAULT SYSUTCDATETIME(),
            updated_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_rental_agreements_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_rental_agreements PRIMARY KEY (agreement_id),
            CONSTRAINT FK_rental_agreements_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT FK_rental_agreements_users FOREIGN KEY (vendor_id)
                REFERENCES dbo.users(user_id),
            CONSTRAINT CK_rental_agreements_dates CHECK (end_date > start_date),
            CONSTRAINT CK_rental_agreements_rent CHECK (monthly_rent > 0),
            CONSTRAINT CK_rental_agreements_status
                CHECK (status IN ('Draft', 'Active', 'Expired', 'Terminated'))
        );
        CREATE INDEX IX_rental_agreements_stall_status
            ON dbo.rental_agreements(stall_id, status);
    END;

    IF OBJECT_ID(N'dbo.complaints', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.complaints (
            complaint_id   INT IDENTITY(1,1) NOT NULL,
            stall_id       INT NOT NULL,
            customer_id    INT NULL,
            category       NVARCHAR(80) NOT NULL,
            description    NVARCHAR(1000) NOT NULL,
            status         VARCHAR(20) NOT NULL
                CONSTRAINT DF_complaints_status DEFAULT ('Submitted'),
            created_at     DATETIME2(0) NOT NULL
                CONSTRAINT DF_complaints_created_at DEFAULT SYSUTCDATETIME(),
            updated_at     DATETIME2(0) NOT NULL
                CONSTRAINT DF_complaints_updated_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_complaints PRIMARY KEY (complaint_id),
            CONSTRAINT FK_complaints_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT FK_complaints_users FOREIGN KEY (customer_id)
                REFERENCES dbo.users(user_id),
            CONSTRAINT CK_complaints_status
                CHECK (status IN ('Submitted', 'Under Review', 'Resolved', 'Rejected'))
        );
        CREATE INDEX IX_complaints_stall_status
            ON dbo.complaints(stall_id, status);
    END;

    /* ================================================================
       Legacy compatibility schema used by teammate modules and startup
       ================================================================ */
    IF OBJECT_ID(N'dbo.UserRole', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.UserRole (
            UserRoleID   INT IDENTITY(1,1) NOT NULL,
            RoleName     NVARCHAR(40) NOT NULL,
            CONSTRAINT PK_UserRole PRIMARY KEY (UserRoleID),
            CONSTRAINT UQ_UserRole_RoleName UNIQUE (RoleName)
        );
    END;

    IF OBJECT_ID(N'dbo.UserAccount', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.UserAccount (
            UserAccountID   INT IDENTITY(1,1) NOT NULL,
            UserRoleID      INT NOT NULL,
            FullName        NVARCHAR(120) NOT NULL,
            Email           NVARCHAR(254) NOT NULL,
            PasswordHash    NVARCHAR(100) NOT NULL,
            AccountStatus   VARCHAR(20) NOT NULL
                CONSTRAINT DF_UserAccount_AccountStatus DEFAULT ('Active'),
            CreatedAt       DATETIME2(0) NOT NULL
                CONSTRAINT DF_UserAccount_CreatedAt DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_UserAccount PRIMARY KEY (UserAccountID),
            CONSTRAINT FK_UserAccount_UserRole FOREIGN KEY (UserRoleID)
                REFERENCES dbo.UserRole(UserRoleID),
            CONSTRAINT UQ_UserAccount_Email UNIQUE (Email),
            CONSTRAINT CK_UserAccount_Status
                CHECK (AccountStatus IN ('Active', 'Deactivated', 'Suspended'))
        );
    END;

    IF OBJECT_ID(N'dbo.Customer', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Customer (
            CustomerID     VARCHAR(5) NOT NULL,
            CustName       NVARCHAR(120) NOT NULL,
            Email          NVARCHAR(254) NULL,
            LinkedUserID   INT NULL,
            CONSTRAINT PK_Customer PRIMARY KEY (CustomerID),
            CONSTRAINT FK_Customer_users FOREIGN KEY (LinkedUserID)
                REFERENCES dbo.users(user_id),
            --CONSTRAINT UQ_Customer_LinkedUserID UNIQUE (LinkedUserID)
        );
    END;

    IF OBJECT_ID(N'dbo.StallOwner', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.StallOwner (
            OwnerID       VARCHAR(5) NOT NULL,
            OwnerName     NVARCHAR(120) NOT NULL,
            Email         NVARCHAR(254) NULL,
            LinkedUserID  INT NULL,
            CONSTRAINT PK_StallOwner PRIMARY KEY (OwnerID),
            CONSTRAINT FK_StallOwner_users FOREIGN KEY (LinkedUserID)
                REFERENCES dbo.users(user_id),
            --CONSTRAINT UQ_StallOwner_LinkedUserID UNIQUE (LinkedUserID)
        );
    END;

    IF OBJECT_ID(N'dbo.NEA_Officer', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.NEA_Officer (
            OfficerID      VARCHAR(5) NOT NULL,
            OfficerName    NVARCHAR(120) NOT NULL,
            Email          NVARCHAR(254) NULL,
            LinkedUserID   INT NULL,
            CONSTRAINT PK_NEA_Officer PRIMARY KEY (OfficerID),
            CONSTRAINT FK_NEA_Officer_users FOREIGN KEY (LinkedUserID)
                REFERENCES dbo.users(user_id),
            --CONSTRAINT UQ_NEA_Officer_LinkedUserID UNIQUE (LinkedUserID)
        );
    END;

    IF OBJECT_ID(N'dbo.FoodStall', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.FoodStall (
            StallID         VARCHAR(4) NOT NULL,
            StallName       NVARCHAR(150) NOT NULL,
            OwnerID         VARCHAR(5) NULL,
            LinkedStallID   INT NULL,
            IsActive        BIT NOT NULL
                CONSTRAINT DF_FoodStall_IsActive DEFAULT (1),
            CONSTRAINT PK_FoodStall PRIMARY KEY (StallID),
            CONSTRAINT FK_FoodStall_StallOwner FOREIGN KEY (OwnerID)
                REFERENCES dbo.StallOwner(OwnerID),
            CONSTRAINT FK_FoodStall_stalls FOREIGN KEY (LinkedStallID)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT UQ_FoodStall_LinkedStallID UNIQUE (LinkedStallID)
        );
    END;

    IF OBJECT_ID(N'dbo.MenuItem', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.MenuItem (
            MenuItemID        INT IDENTITY(1,1) NOT NULL,
            StallID           VARCHAR(4) NOT NULL,
            ItemCode          VARCHAR(10) NOT NULL,
            ItemDesc          NVARCHAR(150) NOT NULL,
            ItemPrice         DECIMAL(10,2) NOT NULL,
            IsAvailable       BIT NOT NULL
                CONSTRAINT DF_MenuItem_IsAvailable DEFAULT (1),
            LinkedMenuItemID  INT NULL,
            CONSTRAINT PK_MenuItem PRIMARY KEY (MenuItemID),
            CONSTRAINT FK_MenuItem_FoodStall FOREIGN KEY (StallID)
                REFERENCES dbo.FoodStall(StallID),
            CONSTRAINT FK_MenuItem_menu_items FOREIGN KEY (LinkedMenuItemID)
                REFERENCES dbo.menu_items(menu_item_id),
            CONSTRAINT UQ_MenuItem_Stall_ItemCode UNIQUE (StallID, ItemCode),
            CONSTRAINT UQ_MenuItem_LinkedMenuItemID UNIQUE (LinkedMenuItemID),
            CONSTRAINT CK_MenuItem_Price CHECK (ItemPrice > 0)
        );
    END;

    IF OBJECT_ID(N'dbo.Inspection', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Inspection (
            InspectionID    VARCHAR(10) NOT NULL,
            InspectionDate  DATE NOT NULL,
            GradeExpiry     DATE NOT NULL,
            HygieneGrade    CHAR(1) NOT NULL,
            OfficerID       VARCHAR(5) NOT NULL,
            StallID         VARCHAR(4) NOT NULL,
            CONSTRAINT PK_Inspection PRIMARY KEY (InspectionID),
            CONSTRAINT FK_Inspection_NEA_Officer FOREIGN KEY (OfficerID)
                REFERENCES dbo.NEA_Officer(OfficerID),
            CONSTRAINT FK_Inspection_FoodStall FOREIGN KEY (StallID)
                REFERENCES dbo.FoodStall(StallID),
            CONSTRAINT CK_Inspection_Grade CHECK (HygieneGrade IN ('A', 'B', 'C', 'D')),
            CONSTRAINT CK_Inspection_Dates CHECK (GradeExpiry >= InspectionDate)
        );
        CREATE INDEX IX_Inspection_Stall_Date
            ON dbo.Inspection(StallID, InspectionDate DESC);
    END;

    IF OBJECT_ID(N'dbo.InspectionRemark', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.InspectionRemark (
            InspectionID      VARCHAR(10) NOT NULL,
            InspectionRemark  NVARCHAR(500) NULL,
            CONSTRAINT PK_InspectionRemark PRIMARY KEY (InspectionID),
            CONSTRAINT FK_InspectionRemark_Inspection FOREIGN KEY (InspectionID)
                REFERENCES dbo.Inspection(InspectionID) ON DELETE CASCADE
        );
    END;

    /*
      SQL Server's normal case-insensitive collation treats Feedback and feedback
      as the same object. This hybrid table contains both column sets required by
      stallModel.js and the legacy feedback/complaint models.
    */
    IF OBJECT_ID(N'dbo.Feedback', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Feedback (
            FbkID             VARCHAR(10) NOT NULL,
            feedback_id       BIGINT IDENTITY(1,1) NOT NULL,
            Category          NVARCHAR(80) NOT NULL,
            Subcategory       NVARCHAR(80) NOT NULL,
            FbkComment        NVARCHAR(400) NOT NULL,
            FbkDateTime       DATETIME2(0) NOT NULL
                CONSTRAINT DF_Feedback_FbkDateTime DEFAULT SYSDATETIME(),
            FbkRating         TINYINT NOT NULL,
            CustomerID        VARCHAR(5) NOT NULL,
            StallID           VARCHAR(4) NOT NULL,
            stall_id          INT NULL,
            overall_rating    DECIMAL(3,2) NULL,
            created_at        DATETIME2(0) NOT NULL
                CONSTRAINT DF_Feedback_created_at DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_Feedback PRIMARY KEY (FbkID),
            CONSTRAINT UQ_Feedback_feedback_id UNIQUE (feedback_id),
            CONSTRAINT FK_Feedback_Customer FOREIGN KEY (CustomerID)
                REFERENCES dbo.Customer(CustomerID),
            CONSTRAINT FK_Feedback_FoodStall FOREIGN KEY (StallID)
                REFERENCES dbo.FoodStall(StallID),
            CONSTRAINT FK_Feedback_stalls FOREIGN KEY (stall_id)
                REFERENCES dbo.stalls(stall_id),
            CONSTRAINT CK_Feedback_Rating CHECK (FbkRating BETWEEN 1 AND 5),
            CONSTRAINT CK_Feedback_OverallRating
                CHECK (overall_rating IS NULL OR overall_rating BETWEEN 1 AND 5)
        );
        CREATE INDEX IX_Feedback_Category_Date
            ON dbo.Feedback(Category, FbkDateTime DESC);
        CREATE INDEX IX_Feedback_LegacyStall_Date
            ON dbo.Feedback(StallID, FbkDateTime DESC);
        CREATE INDEX IX_Feedback_NormalizedStall
            ON dbo.Feedback(stall_id, overall_rating);
    END;

    IF OBJECT_ID(N'dbo.Likes', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Likes (
            CustomerID   VARCHAR(5) NOT NULL,
            StallID      VARCHAR(4) NOT NULL,
            ItemCode     VARCHAR(10) NOT NULL,
            CONSTRAINT PK_Likes PRIMARY KEY (CustomerID, StallID, ItemCode),
            CONSTRAINT FK_Likes_Customer FOREIGN KEY (CustomerID)
                REFERENCES dbo.Customer(CustomerID),
            CONSTRAINT FK_Likes_MenuItem FOREIGN KEY (StallID, ItemCode)
                REFERENCES dbo.MenuItem(StallID, ItemCode)
        );
        CREATE INDEX IX_Likes_Stall_Item
            ON dbo.Likes(StallID, ItemCode);
    END;

    IF OBJECT_ID(N'dbo.CustOrder', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CustOrder (
            OrderID      VARCHAR(10) NOT NULL,
            OrderDate    DATE NOT NULL
                CONSTRAINT DF_CustOrder_OrderDate DEFAULT CONVERT(DATE, GETDATE()),
            PmtType      VARCHAR(30) NOT NULL,
            CustomerID   VARCHAR(5) NOT NULL,
            PickupTime   DATETIME2(0) NULL,
            CONSTRAINT PK_CustOrder PRIMARY KEY (OrderID),
            CONSTRAINT FK_CustOrder_Customer FOREIGN KEY (CustomerID)
                REFERENCES dbo.Customer(CustomerID)
        );
        CREATE INDEX IX_CustOrder_Customer_Date
            ON dbo.CustOrder(CustomerID, OrderDate DESC);
    END;

    IF OBJECT_ID(N'dbo.OrderItem', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.OrderItem (
            OrderID       VARCHAR(10) NOT NULL,
            OrderItemNo   INT NOT NULL,
            StallID       VARCHAR(4) NOT NULL,
            ItemCode      VARCHAR(10) NOT NULL,
            Quantity      INT NOT NULL,
            UnitPrice     DECIMAL(10,2) NOT NULL,
            CONSTRAINT PK_OrderItem PRIMARY KEY (OrderID, OrderItemNo),
            CONSTRAINT FK_OrderItem_CustOrder FOREIGN KEY (OrderID)
                REFERENCES dbo.CustOrder(OrderID) ON DELETE CASCADE,
            CONSTRAINT FK_OrderItem_MenuItem FOREIGN KEY (StallID, ItemCode)
                REFERENCES dbo.MenuItem(StallID, ItemCode),
            CONSTRAINT CK_OrderItem_Quantity CHECK (Quantity > 0),
            CONSTRAINT CK_OrderItem_UnitPrice CHECK (UnitPrice >= 0)
        );
        CREATE INDEX IX_OrderItem_Stall_Item
            ON dbo.OrderItem(StallID, ItemCode);
    END;

    IF OBJECT_ID(N'dbo.RentalAgreement', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.RentalAgreement (
            AgreementID       VARCHAR(10) NOT NULL,
            AgrStartDate      SMALLDATETIME NOT NULL,
            AgrEndDate        SMALLDATETIME NOT NULL,
            AgrTermCondition  VARCHAR(200) NULL,
            RentalPrice       MONEY NOT NULL,
            OwnerID           VARCHAR(5) NOT NULL,
            StallID           VARCHAR(4) NOT NULL,
            CONSTRAINT PK_RentalAgreement PRIMARY KEY (AgreementID),
            CONSTRAINT FK_RentalAgreement_StallOwner FOREIGN KEY (OwnerID)
                REFERENCES dbo.StallOwner(OwnerID),
            CONSTRAINT FK_RentalAgreement_FoodStall FOREIGN KEY (StallID)
                REFERENCES dbo.FoodStall(StallID),
            CONSTRAINT CK_RentalAgreement_Dates CHECK (AgrEndDate > AgrStartDate),
            CONSTRAINT CK_RentalAgreement_Price CHECK (RentalPrice > 0)
        );
        CREATE INDEX IX_RentalAgreement_Owner_Date
            ON dbo.RentalAgreement(OwnerID, AgrStartDate DESC);
        CREATE INDEX IX_RentalAgreement_Stall_Date
            ON dbo.RentalAgreement(StallID, AgrStartDate DESC);
    END;

    /* ================================================================
       Seed authoritative roles in both schemas
       ================================================================ */
    MERGE dbo.roles AS target
    USING (VALUES
        (N'Customer'),
        (N'Vendor'),
        (N'Operator'),
        (N'NEA Officer'),
        (N'Administrator')
    ) AS source(role_name)
      ON target.role_name = source.role_name
    WHEN NOT MATCHED THEN
      INSERT (role_name) VALUES (source.role_name);

    MERGE dbo.UserRole AS target
    USING (VALUES
        (N'Customer'),
        (N'Vendor'),
        (N'Operator'),
        (N'NEA Officer'),
        (N'Administrator')
    ) AS source(RoleName)
      ON target.RoleName = source.RoleName
    WHEN NOT MATCHED THEN
      INSERT (RoleName) VALUES (source.RoleName);
    
    /* ================================================================
   Seed NEA Officer test login
   ================================================================ */
   /*
    DECLARE @NeaOfficerRoleId INT;
    DECLARE @NeaOfficerPasswordHash NVARCHAR(100);

    SELECT @NeaOfficerRoleId = role_id
    FROM dbo.roles
    WHERE role_name = N'NEA Officer';

    SET @NeaOfficerPasswordHash =
        N'$2b$12$oWUy/nqgYCGtexuMt1Dfa.2.A41hF3Z6zxyWoe7YdVKGgLWWm5Pce';

    IF @NeaOfficerRoleId IS NULL
    BEGIN
        THROW 51010, 'NEA Officer role was not found.', 1;
    END;

    IF @NeaOfficerPasswordHash IS NULL
    OR @NeaOfficerPasswordHash = N''
    BEGIN
        THROW 51011, 'NEA Officer password hash is missing.', 1;
    END;

    MERGE dbo.users AS target
    USING (
        VALUES (
            N'Nina NEA Officer',
            N'ninanea@gmail.com',
            N'ninanea@gmail.com',
            @NeaOfficerPasswordHash,
            N'91234567'
        )
    ) AS source (
        full_name,
        email,
        email_normalized,
        password_hash,
        phone
    )
    ON target.email_normalized = source.email_normalized

    WHEN MATCHED THEN
        UPDATE SET
            target.role_id = @NeaOfficerRoleId,
            target.full_name = source.full_name,
            target.email = source.email,
            target.password_hash = source.password_hash,
            target.phone = source.phone,
            target.account_status = 'Active',
            target.updated_at = SYSUTCDATETIME()

    WHEN NOT MATCHED THEN
        INSERT (
            role_id,
            full_name,
            email,
            email_normalized,
            password_hash,
            phone,
            account_status
        )
        VALUES (
            @NeaOfficerRoleId,
            source.full_name,
            source.email,
            source.email_normalized,
            source.password_hash,
            source.phone,
            'Active'
        );
        INSERT INTO NEA_Officer
        (
            OfficerID,
            OfficerName,
            Email,
            LinkedUserID
        )
        VALUES
        (
        'N002',
        'Nina NEA Officer',
        'ninanea@gmail.com',
        5
        );
        */
    /* ================================================================
       Minimal reference/sample data (no application passwords)
       ================================================================ */
    MERGE dbo.cuisines AS target
    USING (VALUES
        (N'Chinese'), (N'Malay'), (N'Indian'), (N'Western'),
        (N'Japanese'), (N'Vegetarian'), (N'Drinks'), (N'Desserts')
    ) AS source(name)
      ON target.name = source.name
    WHEN NOT MATCHED THEN INSERT (name) VALUES (source.name);

    IF NOT EXISTS (
        SELECT 1 FROM dbo.hawker_centres
        WHERE address = N'448 Clementi Avenue 3, Singapore 120448'
    )
    BEGIN
        INSERT dbo.hawker_centres
            (name, town, address, nearest_mrt, opening_hours, description)
        VALUES
            (N'Clementi 448 Market & Food Centre', N'Clementi',
             N'448 Clementi Avenue 3, Singapore 120448', N'Clementi MRT',
             N'06:00-22:00', N'Sample centre for local integration testing.');
    END;

    DECLARE @SampleCentreID INT = (
        SELECT centre_id FROM dbo.hawker_centres
        WHERE address = N'448 Clementi Avenue 3, Singapore 120448'
    );

    IF NOT EXISTS (
        SELECT 1 FROM dbo.stalls
        WHERE centre_id = @SampleCentreID AND unit_number = N'#01-01'
    )
    BEGIN
        INSERT dbo.stalls
            (centre_id, name, unit_number, description, opening_hours)
        VALUES
            (@SampleCentreID, N'HawkerHub Sample Kitchen', N'#01-01',
             N'Sample stall for browse, menu and hygiene testing.', N'08:00-20:00');
    END;

    DECLARE @SampleStallID INT = (
        SELECT stall_id FROM dbo.stalls
        WHERE centre_id = @SampleCentreID AND unit_number = N'#01-01'
    );
    DECLARE @ChineseCuisineID INT = (
        SELECT cuisine_id FROM dbo.cuisines WHERE name = N'Chinese'
    );

    IF NOT EXISTS (
        SELECT 1 FROM dbo.stall_cuisines
        WHERE stall_id = @SampleStallID AND cuisine_id = @ChineseCuisineID
    )
    BEGIN
        INSERT dbo.stall_cuisines(stall_id, cuisine_id, is_primary)
        VALUES (@SampleStallID, @ChineseCuisineID, 1);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.inspections
        WHERE stall_id = @SampleStallID AND inspection_date = '2026-07-15'
    )
    BEGIN
        INSERT dbo.inspections
            (stall_id, inspection_date, grade, score, status, remarks, valid_until)
        VALUES
            (@SampleStallID, '2026-07-15', 'A', 92.00, 'Completed',
             N'Clean preparation area and correct food storage.', '2027-07-14');
    END;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.crowd_updates WHERE centre_id = @SampleCentreID
    )
    BEGIN
        INSERT dbo.crowd_updates
            (centre_id, percentage, crowd_label, estimated_seats)
        VALUES (@SampleCentreID, 35, 'Moderate', 156);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.menu_items
        WHERE stall_id = @SampleStallID AND name = N'Sample Chicken Rice'
    )
    BEGIN
        INSERT dbo.menu_items
            (stall_id, name, category, description, price,
             preparation_minutes, is_available)
        VALUES
            (@SampleStallID, N'Sample Chicken Rice', N'Main',
             N'Roasted chicken with fragrant rice and chilli sauce.',
             5.50, 8, 1);
    END;

    DECLARE @SampleMenuItemID INT = (
        SELECT menu_item_id FROM dbo.menu_items
        WHERE stall_id = @SampleStallID AND name = N'Sample Chicken Rice'
    );

    IF NOT EXISTS (
        SELECT 1 FROM dbo.menu_item_cuisines
        WHERE menu_item_id = @SampleMenuItemID
          AND cuisine_id = @ChineseCuisineID
    )
    BEGIN
        INSERT dbo.menu_item_cuisines(menu_item_id, cuisine_id)
        VALUES (@SampleMenuItemID, @ChineseCuisineID);
    END;

    MERGE dbo.Customer AS target
    USING (VALUES ('C0000', N'Local Test Customer', N'customer.test@example.invalid'))
      AS source(CustomerID, CustName, Email)
      ON target.CustomerID = source.CustomerID
    WHEN NOT MATCHED THEN
      INSERT (CustomerID, CustName, Email)
      VALUES (source.CustomerID, source.CustName, source.Email);

    MERGE dbo.StallOwner AS target
    USING (VALUES ('V0000', N'Local Test Stall Owner', N'vendor.test@example.invalid'))
      AS source(OwnerID, OwnerName, Email)
      ON target.OwnerID = source.OwnerID
    WHEN NOT MATCHED THEN
      INSERT (OwnerID, OwnerName, Email)
      VALUES (source.OwnerID, source.OwnerName, source.Email);

    MERGE dbo.NEA_Officer AS target
    USING (VALUES ('N0000', N'Local Test NEA Officer', N'officer.test@example.invalid'))
      AS source(OfficerID, OfficerName, Email)
      ON target.OfficerID = source.OfficerID
    WHEN NOT MATCHED THEN
      INSERT (OfficerID, OfficerName, Email)
      VALUES (source.OfficerID, source.OfficerName, source.Email);

    MERGE dbo.FoodStall AS target
    USING (VALUES ('0', N'Legacy Sample Food Stall', 'V0000'))
      AS source(StallID, StallName, OwnerID)
      ON target.StallID = source.StallID
    WHEN NOT MATCHED THEN
      INSERT (StallID, StallName, OwnerID)
      VALUES (source.StallID, source.StallName, source.OwnerID);

    MERGE dbo.MenuItem AS target
    USING (VALUES ('0', '0', N'Legacy Sample Meal', CAST(6.00 AS DECIMAL(10,2))))
      AS source(StallID, ItemCode, ItemDesc, ItemPrice)
      ON target.StallID = source.StallID AND target.ItemCode = source.ItemCode
    WHEN NOT MATCHED THEN
      INSERT (StallID, ItemCode, ItemDesc, ItemPrice)
      VALUES (source.StallID, source.ItemCode, source.ItemDesc, source.ItemPrice);

    MERGE dbo.Inspection AS target
    USING (VALUES ('DINSP00000', CAST('2026-07-15' AS DATE), CAST('2027-07-14' AS DATE),
                   'A', 'N0000', '0'))
      AS source(InspectionID, InspectionDate, GradeExpiry, HygieneGrade, OfficerID, StallID)
      ON target.InspectionID = source.InspectionID
    WHEN NOT MATCHED THEN
      INSERT (InspectionID, InspectionDate, GradeExpiry, HygieneGrade, OfficerID, StallID)
      VALUES (source.InspectionID, source.InspectionDate, source.GradeExpiry,
              source.HygieneGrade, source.OfficerID, source.StallID);

    MERGE dbo.InspectionRemark AS target
    USING (VALUES ('DINSP00000', N'Legacy hygiene smoke-test record.'))
      AS source(InspectionID, InspectionRemark)
      ON target.InspectionID = source.InspectionID
    WHEN NOT MATCHED THEN
      INSERT (InspectionID, InspectionRemark)
      VALUES (source.InspectionID, source.InspectionRemark);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

/* ================================================================
   Compatibility bridges for records created through normalized APIs
   ================================================================ */
CREATE OR ALTER TRIGGER dbo.TR_users_bridge_customer
ON dbo.users
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.Customer AS target
    USING (
        SELECT
            i.user_id,
            i.full_name,
            i.email,
            'C' + RIGHT('0000' + CONVERT(VARCHAR(10), i.user_id), 4) AS CustomerID
        FROM inserted i
        JOIN dbo.roles r ON r.role_id = i.role_id
        WHERE r.role_name = N'Customer' AND i.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET CustName = source.full_name, Email = source.email
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (CustomerID, CustName, Email, LinkedUserID)
      VALUES (source.CustomerID, source.full_name, source.email, source.user_id);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_users_bridge_stall_owner
ON dbo.users
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.StallOwner AS target
    USING (
        SELECT
            i.user_id,
            i.full_name,
            i.email,
            'V' + RIGHT('0000' + CONVERT(VARCHAR(10), i.user_id), 4) AS OwnerID
        FROM inserted i
        JOIN dbo.roles r ON r.role_id = i.role_id
        WHERE r.role_name = N'Vendor' AND i.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET OwnerName = source.full_name, Email = source.email
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (OwnerID, OwnerName, Email, LinkedUserID)
      VALUES (source.OwnerID, source.full_name, source.email, source.user_id);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_users_bridge_nea_officer
ON dbo.users
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.NEA_Officer AS target
    USING (
        SELECT
            i.user_id,
            i.full_name,
            i.email,
            'N' + RIGHT('0000' + CONVERT(VARCHAR(10), i.user_id), 4) AS OfficerID
        FROM inserted i
        JOIN dbo.roles r ON r.role_id = i.role_id
        WHERE r.role_name = N'NEA Officer' AND i.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET OfficerName = source.full_name, Email = source.email
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (OfficerID, OfficerName, Email, LinkedUserID)
      VALUES (source.OfficerID, source.full_name, source.email, source.user_id);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_stalls_bridge_food_stall
ON dbo.stalls
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.FoodStall AS target
    USING (
        SELECT
            i.stall_id,
            CONVERT(VARCHAR(4), i.stall_id) AS LegacyStallID,
            i.name,
            i.is_active
        FROM inserted i
        WHERE i.stall_id <= 9999
    ) AS source
      ON target.LinkedStallID = source.stall_id
    WHEN MATCHED THEN
      UPDATE SET StallName = source.name, IsActive = source.is_active
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (StallID, StallName, LinkedStallID, IsActive)
      VALUES (source.LegacyStallID, source.name, source.stall_id, source.is_active);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_menu_items_bridge_legacy_menu_item
ON dbo.menu_items
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.MenuItem AS target
    USING (
        SELECT
            i.menu_item_id,
            fs.StallID,
            CONVERT(VARCHAR(10), i.menu_item_id) AS ItemCode,
            i.name,
            i.price,
            i.is_available
        FROM inserted i
        JOIN dbo.FoodStall fs ON fs.LinkedStallID = i.stall_id
    ) AS source
      ON target.LinkedMenuItemID = source.menu_item_id
    WHEN MATCHED THEN
      UPDATE SET
        StallID = source.StallID,
        ItemCode = source.ItemCode,
        ItemDesc = source.name,
        ItemPrice = source.price,
        IsAvailable = source.is_available
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (StallID, ItemCode, ItemDesc, ItemPrice, IsAvailable, LinkedMenuItemID)
      VALUES (source.StallID, source.ItemCode, source.name, source.price,
              source.is_available, source.menu_item_id);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_stall_owners_bridge_food_stall_owner
ON dbo.stall_owners
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE fs
    SET fs.OwnerID = so.OwnerID
    FROM dbo.FoodStall fs
    JOIN inserted i ON i.stall_id = fs.LinkedStallID
    JOIN dbo.StallOwner so ON so.LinkedUserID = i.vendor_id
    WHERE i.end_date IS NULL
       OR i.end_date >= CONVERT(DATE, GETDATE());
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_feedback_bridge_normalized_rating
ON dbo.Feedback
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE f
    SET
        f.stall_id = COALESCE(f.stall_id, fs.LinkedStallID),
        f.overall_rating = COALESCE(
            f.overall_rating,
            CONVERT(DECIMAL(3,2), f.FbkRating)
        )
    FROM dbo.Feedback f
    JOIN inserted i ON i.FbkID = f.FbkID
    LEFT JOIN dbo.FoodStall fs ON fs.StallID = f.StallID;
END;
GO

/* Backfill bridges for the sample data created before the triggers. */
UPDATE dbo.users SET updated_at = updated_at;
UPDATE dbo.stalls SET updated_at = updated_at;
UPDATE dbo.menu_items SET updated_at = updated_at;
GO

/* ================================================================
   Application database user and least-privilege data access
   ================================================================ */
IF NOT EXISTS (
    SELECT 1 FROM sys.database_principals
    WHERE name = N'HawkerHubAppLogin'
)
BEGIN
    CREATE USER [HawkerHubAppLogin] FOR LOGIN [HawkerHubAppLogin];
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
    JOIN sys.database_principals rp
      ON rp.principal_id = drm.role_principal_id
    JOIN sys.database_principals mp
      ON mp.principal_id = drm.member_principal_id
    WHERE rp.name = N'db_datareader'
      AND mp.name = N'HawkerHubAppLogin'
)
    ALTER ROLE [db_datareader] ADD MEMBER [HawkerHubAppLogin];
IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
    JOIN sys.database_principals rp
      ON rp.principal_id = drm.role_principal_id
    JOIN sys.database_principals mp
      ON mp.principal_id = drm.member_principal_id
    WHERE rp.name = N'db_datawriter'
      AND mp.name = N'HawkerHubAppLogin'
)
    ALTER ROLE [db_datawriter] ADD MEMBER [HawkerHubAppLogin];
GRANT EXECUTE TO [HawkerHubAppLogin];
GO

/* ================================================================
   Verification queries
   ================================================================ */
SELECT DB_NAME() AS DatabaseName,
       SUSER_SNAME() AS InstalledBy,
       (SELECT schema_version FROM dbo.SchemaMetadata
        WHERE schema_name = N'HawkerHubFinal') AS SchemaVersion;

SELECT role_id, role_name
FROM dbo.roles
ORDER BY role_id;

SELECT COUNT(*) AS TableCount
FROM sys.tables
WHERE schema_id = SCHEMA_ID(N'dbo');

SELECT
    CASE
      WHEN OBJECT_ID(N'dbo.UserAccount', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.UserRole', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.MenuItem', N'MenuItemID') IS NOT NULL
       AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.roles', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.menu_items', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.promotions', N'U') IS NOT NULL
      THEN N'PASS'
      ELSE N'FAIL'
    END AS BackendSchemaCheck;

SELECT
    hc.centre_id,
    hc.name AS centre_name,
    s.stall_id,
    s.name AS stall_name,
    mi.menu_item_id,
    mi.name AS menu_item_name,
    i.grade AS hygiene_grade
FROM dbo.hawker_centres hc
LEFT JOIN dbo.stalls s ON s.centre_id = hc.centre_id
LEFT JOIN dbo.menu_items mi ON mi.stall_id = s.stall_id
OUTER APPLY (
    SELECT TOP (1) grade
    FROM dbo.inspections x
    WHERE x.stall_id = s.stall_id AND x.status = 'Completed'
    ORDER BY x.inspection_date DESC, x.inspection_id DESC
) i
ORDER BY hc.centre_id, s.stall_id, mi.menu_item_id;

SELECT
    dp.name AS DatabaseUser,
    rp.name AS DatabaseRole
FROM sys.database_role_members drm
JOIN sys.database_principals rp ON rp.principal_id = drm.role_principal_id
JOIN sys.database_principals dp ON dp.principal_id = drm.member_principal_id
WHERE dp.name = N'HawkerHubAppLogin'
ORDER BY rp.name;
GO

/* ================================================================
   Sample Data
   ================================================================ */
IF EXISTS (
    SELECT 1
    FROM (VALUES
        (N'dbo.roles'), (N'dbo.users'), (N'dbo.hawker_centres'),
        (N'dbo.operator_centres'), (N'dbo.cuisines'), (N'dbo.stalls'),
        (N'dbo.stall_owners'), (N'dbo.stall_cuisines'),
        (N'dbo.stall_operations'), (N'dbo.menu_items'),
        (N'dbo.menu_item_cuisines'), (N'dbo.menu_add_ons'),
        (N'dbo.promotions'), (N'dbo.promotion_menu_items'),
        (N'dbo.crowd_updates'), (N'dbo.inspections'),
        (N'dbo.rental_agreements'), (N'dbo.complaints'),
        (N'dbo.UserRole'), (N'dbo.UserAccount'), (N'dbo.Customer'),
        (N'dbo.StallOwner'), (N'dbo.NEA_Officer'), (N'dbo.FoodStall'),
        (N'dbo.MenuItem'), (N'dbo.Inspection'),
        (N'dbo.InspectionRemark'), (N'dbo.Feedback'),
        (N'dbo.RentalAgreement')
    ) required(object_name)
    WHERE OBJECT_ID(required.object_name, N'U') IS NULL
)
BEGIN
    THROW 52001,
      'One or more required normalized or legacy tables are missing. Run the complete HCMS.sql first.',
      1;
END;
GO

IF EXISTS (
    SELECT 1
    FROM (VALUES
        (N'dbo.TR_users_bridge_customer'),
        (N'dbo.TR_users_bridge_stall_owner'),
        (N'dbo.TR_users_bridge_nea_officer'),
        (N'dbo.TR_stalls_bridge_food_stall'),
        (N'dbo.TR_menu_items_bridge_legacy_menu_item'),
        (N'dbo.TR_stall_owners_bridge_food_stall_owner'),
        (N'dbo.TR_feedback_bridge_normalized_rating')
    ) required(trigger_name)
    WHERE OBJECT_ID(required.trigger_name, N'TR') IS NULL
)
BEGIN
    THROW 52002,
      'One or more HCMS compatibility triggers are missing. Run the complete HCMS.sql first.',
      1;
END;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ResetExistingDemoPasswords BIT = 0;
    DECLARE @DemoPasswordHash NVARCHAR(100) =
      N'$2b$12$X8JsEE7U.r47o9N6J9nQvO0EUTnKH.hi.pvwd9b2noxOG2e0hxnoy';

    /* ================================================================
       1. Roles and normalized application accounts
       ================================================================ */
    MERGE dbo.roles AS target
    USING (VALUES
        (N'Customer'), (N'Vendor'), (N'Operator'),
        (N'NEA Officer'), (N'Administrator')
    ) AS source(role_name)
      ON target.role_name = source.role_name
    WHEN NOT MATCHED THEN
      INSERT (role_name) VALUES (source.role_name);

    MERGE dbo.UserRole AS target
    USING (VALUES
        (N'Customer'), (N'Vendor'), (N'Operator'),
        (N'NEA Officer'), (N'Administrator')
    ) AS source(RoleName)
      ON target.RoleName = source.RoleName
    WHEN NOT MATCHED THEN
      INSERT (RoleName) VALUES (source.RoleName);

    CREATE TABLE #UserSeed (
        role_name         NVARCHAR(40)  NOT NULL,
        full_name         NVARCHAR(120) NOT NULL,
        email             NVARCHAR(254) NOT NULL,
        phone             VARCHAR(8)    NULL
    );

    INSERT #UserSeed (role_name, full_name, email, phone)
    VALUES
      (N'Customer',    N'Alice Demo Customer',   N'demo.customer01@test.com', '81230001'),
      (N'Customer',    N'Ben Demo Customer',     N'demo.customer02@test.com', '81230002'),
      (N'Customer',    N'Chloe Demo Customer',   N'demo.customer03@test.com', '81230003'),
      (N'Customer',    N'Daniel Demo Customer',  N'demo.customer04@test.com', '81230004'),
      (N'Vendor',      N'Sam Vendor',             N'vendor01@test.com',        '82340001'),
      (N'Vendor',      N'May Vendor',             N'vendor02@test.com',        '82340002'),
      (N'Vendor',      N'Aisha Vendor',           N'vendor03@test.com',        '82340003'),
      (N'Vendor',      N'Daniel Vendor',          N'vendor04@test.com',        '82340004'),
      (N'Vendor',      N'Priya Vendor',           N'vendor05@test.com',        '82340005'),
      (N'Operator',    N'Olivia Centre Operator', N'operator01@test.com',      '83450001'),
      (N'Operator',    N'Omar Centre Operator',   N'operator02@test.com',      '83450002'),
      (N'NEA Officer', N'Nina NEA Officer',       N'ninanea@gmail.com',        '91234567'),
      (N'NEA Officer', N'Noah NEA Officer',       N'nea02@test.com',           '94560002');

    MERGE dbo.users AS target
    USING (
        SELECT
            r.role_id,
            us.full_name,
            us.email,
            LOWER(us.email) AS email_normalized,
            us.phone
        FROM #UserSeed us
        JOIN dbo.roles r ON r.role_name = us.role_name
    ) AS source
      ON target.email_normalized = source.email_normalized
    WHEN MATCHED THEN
      UPDATE SET
        target.role_id = source.role_id,
        target.full_name = source.full_name,
        target.email = source.email,
        target.phone = COALESCE(target.phone, source.phone),
        target.password_hash = CASE
          WHEN @ResetExistingDemoPasswords = 1 THEN @DemoPasswordHash
          ELSE target.password_hash
        END,
        target.account_status = 'Active',
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        role_id, full_name, email, email_normalized, password_hash,
        phone, account_status
      )
      VALUES (
        source.role_id, source.full_name, source.email,
        source.email_normalized, @DemoPasswordHash,
        source.phone, 'Active'
      );

    /* Mirror account identities into the legacy authentication tables. */
    MERGE dbo.UserAccount AS target
    USING (
        SELECT
            ur.UserRoleID,
            u.full_name,
            u.email,
            u.password_hash,
            u.account_status
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        JOIN dbo.roles r ON r.role_id = u.role_id
        JOIN dbo.UserRole ur ON ur.RoleName = r.role_name
    ) AS source
      ON target.Email = source.email
    WHEN MATCHED THEN
      UPDATE SET
        target.UserRoleID = source.UserRoleID,
        target.FullName = source.full_name,
        target.PasswordHash = source.password_hash,
        target.AccountStatus = source.account_status
    WHEN NOT MATCHED THEN
      INSERT (UserRoleID, FullName, Email, PasswordHash, AccountStatus)
      VALUES (
        source.UserRoleID, source.full_name, source.email,
        source.password_hash, source.account_status
      );

    /* Explicitly preserve the user-to-legacy profile links. IDs are derived
       from users found by email; no numeric user identity is hardcoded. */
    MERGE dbo.Customer AS target
    USING (
        SELECT
            u.user_id,
            'C' + RIGHT('0000' + CONVERT(VARCHAR(10), u.user_id), 4) AS CustomerID,
            u.full_name,
            u.email
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        JOIN dbo.roles r ON r.role_id = u.role_id
        WHERE r.role_name = N'Customer' AND u.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET target.CustName = source.full_name, target.Email = source.email
    WHEN NOT MATCHED THEN
      INSERT (CustomerID, CustName, Email, LinkedUserID)
      VALUES (source.CustomerID, source.full_name, source.email, source.user_id);

    MERGE dbo.StallOwner AS target
    USING (
        SELECT
            u.user_id,
            'V' + RIGHT('0000' + CONVERT(VARCHAR(10), u.user_id), 4) AS OwnerID,
            u.full_name,
            u.email
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        JOIN dbo.roles r ON r.role_id = u.role_id
        WHERE r.role_name = N'Vendor' AND u.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET target.OwnerName = source.full_name, target.Email = source.email
    WHEN NOT MATCHED THEN
      INSERT (OwnerID, OwnerName, Email, LinkedUserID)
      VALUES (source.OwnerID, source.full_name, source.email, source.user_id);

    MERGE dbo.NEA_Officer AS target
    USING (
        SELECT
            u.user_id,
            'N' + RIGHT('0000' + CONVERT(VARCHAR(10), u.user_id), 4) AS OfficerID,
            u.full_name,
            u.email
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        JOIN dbo.roles r ON r.role_id = u.role_id
        WHERE r.role_name = N'NEA Officer' AND u.user_id <= 9999
    ) AS source
      ON target.LinkedUserID = source.user_id
    WHEN MATCHED THEN
      UPDATE SET target.OfficerName = source.full_name, target.Email = source.email
    WHEN NOT MATCHED THEN
      INSERT (OfficerID, OfficerName, Email, LinkedUserID)
      VALUES (source.OfficerID, source.full_name, source.email, source.user_id);

    /* ================================================================
       2. Cuisines and four active hawker centres
       ================================================================ */
    MERGE dbo.cuisines AS target
    USING (VALUES
        (N'Chinese'), (N'Malay'), (N'Indian'), (N'Western'),
        (N'Japanese'), (N'Vegetarian'), (N'Drinks'), (N'Desserts')
    ) AS source(name)
      ON target.name = source.name
    WHEN NOT MATCHED THEN INSERT (name) VALUES (source.name);

    CREATE TABLE #CentreSeed (
        name            NVARCHAR(150) NOT NULL,
        town            NVARCHAR(80)  NOT NULL,
        address         NVARCHAR(250) NOT NULL,
        nearest_mrt     NVARCHAR(100) NULL,
        opening_hours   NVARCHAR(120) NULL,
        description     NVARCHAR(500) NULL
    );

    INSERT #CentreSeed
      (name, town, address, nearest_mrt, opening_hours, description)
    VALUES
      (N'Clementi 448 Market & Food Centre', N'Clementi',
       N'448 Clementi Avenue 3, Singapore 120448', N'Clementi MRT',
       N'06:00-22:00',
       N'Existing HawkerHub integration-test centre.'),
      (N'Tampines Central Demo Hawker Centre', N'Tampines',
       N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'Tampines MRT',
       N'07:00-22:00',
       N'Fictional demonstration centre; this is not an official street address.'),
      (N'Jurong East Demo Food Centre', N'Jurong East',
       N'DEMO LOCATION ONLY - Jurong East, Singapore', N'Jurong East MRT',
       N'07:00-21:30',
       N'Fictional demonstration centre; this is not an official street address.'),
      (N'Woodlands Community Demo Market', N'Woodlands',
       N'DEMO LOCATION ONLY - Woodlands, Singapore', N'Woodlands MRT',
       N'06:30-22:00',
       N'Fictional demonstration centre; this is not an official street address.');

    MERGE dbo.hawker_centres AS target
    USING #CentreSeed AS source
      ON target.address = source.address
    WHEN MATCHED THEN
      UPDATE SET
        target.name = source.name,
        target.town = source.town,
        target.nearest_mrt = source.nearest_mrt,
        target.opening_hours = source.opening_hours,
        target.description = source.description,
        target.is_active = 1,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        name, town, address, nearest_mrt, opening_hours,
        description, is_active
      )
      VALUES (
        source.name, source.town, source.address, source.nearest_mrt,
        source.opening_hours, source.description, 1
      );

    /* ================================================================
       3. Ten connected stalls, owners, cuisines and operations
       ================================================================ */
    CREATE TABLE #StallSeed (
        centre_address       NVARCHAR(250) NOT NULL,
        unit_number          NVARCHAR(20)  NOT NULL,
        stall_name           NVARCHAR(150) NOT NULL,
        description          NVARCHAR(500) NOT NULL,
        opening_hours        NVARCHAR(120) NOT NULL,
        vendor_email         NVARCHAR(254) NOT NULL,
        primary_cuisine      NVARCHAR(80)  NOT NULL,
        operator_email       NVARCHAR(254) NOT NULL,
        monthly_rent         DECIMAL(12,2) NOT NULL,
        legacy_agreement_id  VARCHAR(10)   NOT NULL
    );

    INSERT #StallSeed
      (centre_address, unit_number, stall_name, description, opening_hours,
       vendor_email, primary_cuisine, operator_email, monthly_rent,
       legacy_agreement_id)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01',
       N'HawkerHub Sample Kitchen', N'Chicken rice and local comfort food.',
       N'08:00-20:00', N'vendor01@test.com', N'Chinese',
       N'operator01@test.com', 1800.00, 'DRA0000001'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02',
       N'May�s Noodle Corner', N'Classic Singapore noodle dishes.',
       N'07:30-21:00', N'vendor02@test.com', N'Chinese',
       N'operator01@test.com', 1750.00, 'DRA0000002'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03',
       N'Clementi Fresh Drinks', N'Hot and cold local beverages.',
       N'06:30-21:30', N'vendor03@test.com', N'Drinks',
       N'operator01@test.com', 1400.00, 'DRA0000003'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01',
       N'Tampines Spice Garden', N'Malay favourites and hearty rice dishes.',
       N'07:00-21:30', N'vendor04@test.com', N'Malay',
       N'operator01@test.com', 1850.00, 'DRA0000004'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02',
       N'Eastside Western Grill', N'Freshly grilled western meals.',
       N'10:30-22:00', N'vendor05@test.com', N'Western',
       N'operator01@test.com', 1950.00, 'DRA0000005'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03',
       N'Sweet Bowl Desserts', N'Cold and warm local desserts.',
       N'11:00-22:00', N'vendor02@test.com', N'Desserts',
       N'operator01@test.com', 1550.00, 'DRA0000006'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01',
       N'Jurong Vegetarian Kitchen', N'Meat-free rice and noodle meals.',
       N'07:30-20:30', N'vendor03@test.com', N'Vegetarian',
       N'operator02@test.com', 1700.00, 'DRA0000007'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02',
       N'Golden Wok Noodles', N'Noodles, dumplings and roasted meats.',
       N'08:00-21:00', N'vendor04@test.com', N'Chinese',
       N'operator02@test.com', 1800.00, 'DRA0000008'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01',
       N'Northern Malay Delights', N'Malay classics and rich slow-cooked dishes.',
       N'07:00-21:30', N'vendor05@test.com', N'Malay',
       N'operator02@test.com', 1650.00, 'DRA0000009'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02',
       N'Woodlands Indian Kitchen', N'Biryani, thosai and prata favourites.',
       N'07:00-22:00', N'vendor01@test.com', N'Indian',
       N'operator02@test.com', 1750.00, 'DRA0000010');

    MERGE dbo.stalls AS target
    USING (
        SELECT
            hc.centre_id,
            ss.unit_number,
            ss.stall_name,
            ss.description,
            ss.opening_hours
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
    ) AS source
      ON target.centre_id = source.centre_id
     AND target.unit_number = source.unit_number
    WHEN MATCHED THEN
      UPDATE SET
        target.name = source.stall_name,
        target.description = source.description,
        target.opening_hours = source.opening_hours,
        target.is_active = 1,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        centre_id, name, unit_number, description, opening_hours, is_active
      )
      VALUES (
        source.centre_id, source.stall_name, source.unit_number,
        source.description, source.opening_hours, 1
      );

    INSERT dbo.stall_owners
      (stall_id, vendor_id, start_date, end_date)
    SELECT
        s.stall_id,
        u.user_id,
        CAST('2026-01-01' AS DATE),
        NULL
    FROM #StallSeed ss
    JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
    JOIN dbo.stalls s
      ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
    JOIN dbo.users u ON u.email_normalized = LOWER(ss.vendor_email)
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.stall_owners so
        WHERE so.stall_id = s.stall_id
          AND so.vendor_id = u.user_id
          AND so.end_date IS NULL
    );

    MERGE dbo.stall_cuisines AS target
    USING (
        SELECT s.stall_id, c.cuisine_id
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        JOIN dbo.cuisines c ON c.name = ss.primary_cuisine
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.cuisine_id = source.cuisine_id
    WHEN MATCHED THEN UPDATE SET target.is_primary = 1
    WHEN NOT MATCHED THEN
      INSERT (stall_id, cuisine_id, is_primary)
      VALUES (source.stall_id, source.cuisine_id, 1);

    MERGE dbo.stall_operations AS target
    USING (
        SELECT s.stall_id, op.user_id AS updated_by
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        JOIN dbo.users op ON op.email_normalized = LOWER(ss.operator_email)
    ) AS source
      ON target.stall_id = source.stall_id
    WHEN MATCHED THEN
      UPDATE SET
        target.operational_status = 'Open',
        target.maintenance_note = N'Demo seed: ready for service.',
        target.updated_by = source.updated_by,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id, operational_status, maintenance_note, updated_by
      )
      VALUES (
        source.stall_id, 'Open', N'Demo seed: ready for service.',
        source.updated_by
      );

    CREATE TABLE #OperatorCentreSeed (
        operator_email  NVARCHAR(254) NOT NULL,
        centre_address  NVARCHAR(250) NOT NULL
    );

    INSERT #OperatorCentreSeed (operator_email, centre_address)
    VALUES
      (N'operator01@test.com', N'448 Clementi Avenue 3, Singapore 120448'),
      (N'operator01@test.com', N'DEMO LOCATION ONLY - Tampines Central, Singapore'),
      (N'operator02@test.com', N'DEMO LOCATION ONLY - Jurong East, Singapore'),
      (N'operator02@test.com', N'DEMO LOCATION ONLY - Woodlands, Singapore');

    MERGE dbo.operator_centres AS target
    USING (
        SELECT u.user_id, hc.centre_id
        FROM #OperatorCentreSeed ocs
        JOIN dbo.users u ON u.email_normalized = LOWER(ocs.operator_email)
        JOIN dbo.hawker_centres hc ON hc.address = ocs.centre_address
    ) AS source
      ON target.user_id = source.user_id
     AND target.centre_id = source.centre_id
    WHEN NOT MATCHED THEN
      INSERT (user_id, centre_id)
      VALUES (source.user_id, source.centre_id);

    MERGE dbo.rental_agreements AS target
    USING (
        SELECT
            s.stall_id,
            v.user_id AS vendor_id,
            ss.monthly_rent
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        JOIN dbo.users v ON v.email_normalized = LOWER(ss.vendor_email)
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.vendor_id = source.vendor_id
     AND target.start_date = CAST('2026-01-01' AS DATE)
     AND target.end_date = CAST('2027-12-31' AS DATE)
    WHEN MATCHED THEN
      UPDATE SET
        target.monthly_rent = source.monthly_rent,
        target.terms = N'Demonstration agreement for local application testing.',
        target.status = 'Active',
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id, vendor_id, start_date, end_date,
        monthly_rent, terms, status
      )
      VALUES (
        source.stall_id, source.vendor_id, '2026-01-01', '2027-12-31',
        source.monthly_rent,
        N'Demonstration agreement for local application testing.', 'Active'
      );

    /* Force bridge refreshes for pre-existing normalized rows. */
    UPDATE s
    SET s.updated_at = s.updated_at
    FROM dbo.stalls s
    JOIN dbo.hawker_centres hc ON hc.centre_id = s.centre_id
    JOIN #StallSeed ss
      ON ss.centre_address = hc.address AND ss.unit_number = s.unit_number;

    UPDATE so
    SET so.created_at = so.created_at
    FROM dbo.stall_owners so
    JOIN dbo.stalls s ON s.stall_id = so.stall_id
    JOIN dbo.hawker_centres hc ON hc.centre_id = s.centre_id
    JOIN #StallSeed ss
      ON ss.centre_address = hc.address AND ss.unit_number = s.unit_number
    JOIN dbo.users v
      ON v.user_id = so.vendor_id
     AND v.email_normalized = LOWER(ss.vendor_email)
    WHERE so.end_date IS NULL;

    /* Legacy rental compatibility records use natural-key lookups for both
       owner and stall; only the legacy agreement code is a literal key. */
    MERGE dbo.RentalAgreement AS target
    USING (
        SELECT
            ss.legacy_agreement_id,
            owner_profile.OwnerID,
            fs.StallID,
            ss.monthly_rent
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        JOIN dbo.FoodStall fs ON fs.LinkedStallID = s.stall_id
        JOIN dbo.users v ON v.email_normalized = LOWER(ss.vendor_email)
        JOIN dbo.StallOwner owner_profile
          ON owner_profile.LinkedUserID = v.user_id
    ) AS source
      ON target.AgreementID = source.legacy_agreement_id
    WHEN MATCHED THEN
      UPDATE SET
        target.AgrStartDate = CAST('2026-01-01' AS SMALLDATETIME),
        target.AgrEndDate = CAST('2027-12-31' AS SMALLDATETIME),
        target.AgrTermCondition = 'Demo agreement for local testing.',
        target.RentalPrice = source.monthly_rent,
        target.OwnerID = source.OwnerID,
        target.StallID = source.StallID
    WHEN NOT MATCHED THEN
      INSERT (
        AgreementID, AgrStartDate, AgrEndDate, AgrTermCondition,
        RentalPrice, OwnerID, StallID
      )
      VALUES (
        source.legacy_agreement_id, '2026-01-01', '2027-12-31',
        'Demo agreement for local testing.', source.monthly_rent,
        source.OwnerID, source.StallID
      );

    /* ================================================================
       4. Complete menus (51 available items) and cuisine links
       ================================================================ */
    CREATE TABLE #MenuSeed (
        centre_address       NVARCHAR(250) NOT NULL,
        unit_number          NVARCHAR(20)  NOT NULL,
        item_name            NVARCHAR(150) NOT NULL,
        category             NVARCHAR(60)  NOT NULL,
        description          NVARCHAR(600) NOT NULL,
        price                DECIMAL(10,2) NOT NULL,
        preparation_minutes  INT NOT NULL,
        cuisine_name         NVARCHAR(80) NOT NULL
    );

    INSERT #MenuSeed
      (centre_address, unit_number, item_name, category, description,
       price, preparation_minutes, cuisine_name)
    VALUES
      /* HawkerHub Sample Kitchen: 6 */
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sample Chicken Rice', N'Main', N'Roasted chicken with fragrant rice and chilli sauce.', 5.50, 8, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Roasted Chicken Rice', N'Main', N'Roasted chicken, seasoned rice, cucumber and house chilli.', 6.00, 9, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Steamed Chicken Rice', N'Main', N'Tender steamed chicken served with fragrant rice.', 5.80, 8, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Chicken Cutlet Rice', N'Main', N'Crispy chicken cutlet with rice and savoury sauce.', 6.50, 12, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Chicken Noodle', N'Noodles', N'Springy noodles topped with sliced chicken and greens.', 5.80, 10, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Iced Lemon Tea', N'Drink', N'Chilled tea with a bright lemon finish.', 2.20, 3, N'Drinks'),

      /* May�s Noodle Corner: 5 */
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Fishball Noodles', N'Noodles', N'Fishballs and noodles served dry or with soup.', 5.00, 8, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Minced Meat Noodles', N'Noodles', N'Noodles tossed with minced meat, mushrooms and vinegar.', 5.50, 9, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Laksa', N'Noodles', N'Rice noodles in a fragrant coconut curry broth.', 6.20, 11, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Prawn Noodles', N'Noodles', N'Prawns and noodles in a rich savoury broth.', 6.80, 12, N'Chinese'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Fried Dumplings', N'Side', N'Golden fried dumplings with a crisp wrapper.', 4.50, 8, N'Chinese'),

      /* Clementi Fresh Drinks: 5 */
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Kopi', N'Drink', N'Traditional local coffee with condensed milk.', 1.80, 3, N'Drinks'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Teh', N'Drink', N'Traditional pulled tea with condensed milk.', 1.80, 3, N'Drinks'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Iced Milo', N'Drink', N'Chilled chocolate malt drink.', 2.50, 3, N'Drinks'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Fresh Lime Juice', N'Drink', N'Fresh lime juice served chilled.', 2.80, 4, N'Drinks'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Barley Water', N'Drink', N'Lightly sweetened house-cooked barley drink.', 2.20, 3, N'Drinks'),

      /* Tampines Spice Garden: 5 */
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Nasi Lemak', N'Main', N'Coconut rice with fried chicken, egg, anchovies and sambal.', 6.50, 12, N'Malay'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Mee Rebus', N'Noodles', N'Yellow noodles in a thick sweet-savory gravy.', 5.50, 10, N'Malay'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Mee Soto', N'Noodles', N'Noodles in aromatic chicken soup with shredded chicken.', 5.50, 10, N'Malay'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Ayam Penyet', N'Main', N'Smashed fried chicken with rice, tofu and sambal.', 7.80, 15, N'Malay'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Teh Tarik', N'Drink', N'Pulled milk tea with a frothy top.', 2.20, 4, N'Drinks'),

      /* Eastside Western Grill: 5 */
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Chicken Chop', N'Main', N'Grilled chicken chop with fries and coleslaw.', 9.50, 15, N'Western'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Fish and Chips', N'Main', N'Crispy battered fish with fries and tartar sauce.', 10.50, 16, N'Western'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Grilled Chicken Pasta', N'Pasta', N'Pasta with grilled chicken in a light cream sauce.', 10.80, 18, N'Western'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Mushroom Soup', N'Soup', N'Creamy mushroom soup served warm.', 4.00, 7, N'Western'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'French Fries', N'Side', N'Crisp golden fries with seasoning.', 4.50, 8, N'Western'),

      /* Sweet Bowl Desserts: 5 */
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Ice Kachang', N'Dessert', N'Shaved ice with syrup, beans, jelly and corn.', 3.80, 6, N'Desserts'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Chendol', N'Dessert', N'Coconut milk dessert with palm sugar and green jelly.', 4.20, 6, N'Desserts'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Mango Sago', N'Dessert', N'Chilled mango puree with sago pearls.', 4.80, 5, N'Desserts'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Grass Jelly', N'Dessert', N'Cooling grass jelly with light syrup.', 3.20, 4, N'Desserts'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Red Bean Soup', N'Dessert', N'Warm sweet red bean soup.', 3.50, 5, N'Desserts'),

      /* Jurong Vegetarian Kitchen: 5 */
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Vegetarian Fried Rice', N'Main', N'Wok-fried rice with vegetables and plant-based protein.', 5.80, 10, N'Vegetarian'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Vegetarian Bee Hoon', N'Noodles', N'Rice vermicelli with cabbage, carrot and tofu.', 5.50, 9, N'Vegetarian'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Tofu Rice Bowl', N'Main', N'Braised tofu and seasonal vegetables over rice.', 6.50, 11, N'Vegetarian'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Vegetable Curry', N'Main', N'Mixed vegetables in a fragrant meat-free curry.', 6.20, 12, N'Vegetarian'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Soy Milk', N'Drink', N'Chilled lightly sweetened soy milk.', 2.00, 3, N'Drinks'),

      /* Golden Wok Noodles: 5 */
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Wanton Noodles', N'Noodles', N'Springy noodles with char siew and wantons.', 5.80, 10, N'Chinese'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Dumpling Noodles', N'Noodles', N'Noodles with plump pork and prawn dumplings.', 6.50, 11, N'Chinese'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Char Siew Rice', N'Main', N'Caramelized roast pork over steamed rice.', 6.20, 9, N'Chinese'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Fried Wanton', N'Side', N'Crispy fried wantons with dipping sauce.', 4.20, 7, N'Chinese'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Barley Drink', N'Drink', N'Chilled lightly sweetened barley drink.', 2.20, 3, N'Drinks'),

      /* Northern Malay Delights: 5 */
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Nasi Padang', N'Main', N'Rice with a choice of Malay-style dishes.', 7.50, 13, N'Malay'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Beef Rendang Rice', N'Main', N'Slow-cooked beef rendang served with rice.', 8.50, 15, N'Malay'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Mee Siam', N'Noodles', N'Rice vermicelli with tangy spicy gravy.', 5.50, 10, N'Malay'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Soto Ayam', N'Soup', N'Aromatic chicken soup with rice cakes and herbs.', 6.00, 11, N'Malay'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Bandung', N'Drink', N'Chilled rose-flavoured milk drink.', 2.50, 3, N'Drinks'),

      /* Woodlands Indian Kitchen: 5 */
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Chicken Biryani', N'Main', N'Spiced basmati rice with tender chicken.', 8.00, 15, N'Indian'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Vegetarian Biryani', N'Main', N'Spiced basmati rice with mixed vegetables.', 6.50, 13, N'Indian'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Masala Thosai', N'Main', N'Crisp thosai filled with spiced potato.', 5.50, 12, N'Indian'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Prata', N'Main', N'Flaky griddled flatbread served with curry.', 2.20, 8, N'Indian'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Mango Lassi', N'Drink', N'Chilled mango and yogurt drink.', 3.50, 4, N'Drinks');

    MERGE dbo.menu_items AS target
    USING (
        SELECT
            s.stall_id,
            ms.item_name,
            ms.category,
            ms.description,
            ms.price,
            ms.preparation_minutes
        FROM #MenuSeed ms
        JOIN dbo.hawker_centres hc ON hc.address = ms.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ms.unit_number
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.name = source.item_name
    WHEN MATCHED THEN
      UPDATE SET
        target.category = source.category,
        target.description = source.description,
        target.price = source.price,
        target.preparation_minutes = source.preparation_minutes,
        target.is_available = 1,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id, name, category, description, price,
        preparation_minutes, is_available
      )
      VALUES (
        source.stall_id, source.item_name, source.category,
        source.description, source.price, source.preparation_minutes, 1
      );

    MERGE dbo.menu_item_cuisines AS target
    USING (
        SELECT mi.menu_item_id, c.cuisine_id
        FROM #MenuSeed ms
        JOIN dbo.hawker_centres hc ON hc.address = ms.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ms.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.name = ms.item_name
        JOIN dbo.cuisines c ON c.name = ms.cuisine_name
    ) AS source
      ON target.menu_item_id = source.menu_item_id
     AND target.cuisine_id = source.cuisine_id
    WHEN NOT MATCHED THEN
      INSERT (menu_item_id, cuisine_id)
      VALUES (source.menu_item_id, source.cuisine_id);

    /* Refresh legacy MenuItem rows for old teammate modules. */
    UPDATE mi
    SET mi.updated_at = mi.updated_at
    FROM dbo.menu_items mi
    JOIN dbo.stalls s ON s.stall_id = mi.stall_id
    JOIN dbo.hawker_centres hc ON hc.centre_id = s.centre_id
    JOIN #MenuSeed ms
      ON ms.centre_address = hc.address
     AND ms.unit_number = s.unit_number
     AND ms.item_name = mi.name;

    /* ================================================================
       5. Menu add-ons (22 records)
       ================================================================ */
    CREATE TABLE #AddOnSeed (
        centre_address  NVARCHAR(250) NOT NULL,
        unit_number     NVARCHAR(20)  NOT NULL,
        item_name       NVARCHAR(150) NOT NULL,
        add_on_name     NVARCHAR(100) NOT NULL,
        add_on_price    DECIMAL(10,2) NOT NULL
    );

    INSERT #AddOnSeed
      (centre_address, unit_number, item_name, add_on_name, add_on_price)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sample Chicken Rice', N'Extra Rice', 0.80),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sample Chicken Rice', N'Extra Chicken', 2.50),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sample Chicken Rice', N'Extra Chilli', 0.20),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Chicken Cutlet Rice', N'Fried Egg', 1.00),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Fishball Noodles', N'Extra Noodles', 1.00),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Fishball Noodles', N'Extra Chilli', 0.20),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Laksa', N'Extra Noodles', 1.00),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Kopi', N'Less Sugar', 0.00),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'Fresh Lime Juice', N'Extra Ice', 0.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Nasi Lemak', N'Fried Egg', 1.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'Ayam Penyet', N'Extra Chilli', 0.30),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Chicken Chop', N'Cheese', 1.20),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Chicken Chop', N'Curry Sauce', 0.80),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Fish and Chips', N'Cheese', 1.20),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Ice Kachang', N'Extra Ice', 0.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Mango Sago', N'Less Sugar', 0.00),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'Tofu Rice Bowl', N'Extra Tofu', 1.50),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Wanton Noodles', N'Extra Noodles', 1.00),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Wanton Noodles', N'Extra Chilli', 0.20),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Nasi Padang', N'Extra Rice', 0.80),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Chicken Biryani', N'Extra Rice', 0.80),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'Chicken Biryani', N'Curry Sauce', 0.80);

    MERGE dbo.menu_add_ons AS target
    USING (
        SELECT mi.menu_item_id, aos.add_on_name, aos.add_on_price
        FROM #AddOnSeed aos
        JOIN dbo.hawker_centres hc ON hc.address = aos.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = aos.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.name = aos.item_name
    ) AS source
      ON target.menu_item_id = source.menu_item_id
     AND target.name = source.add_on_name
    WHEN MATCHED THEN
      UPDATE SET target.price = source.add_on_price, target.is_available = 1
    WHEN NOT MATCHED THEN
      INSERT (menu_item_id, name, price, is_available)
      VALUES (
        source.menu_item_id, source.add_on_name, source.add_on_price, 1
      );



    /* ================================================================
       100 likes: at least 1 like for every menu item
       ================================================================ */
    CREATE TABLE #LikeSeed (
        customer_id VARCHAR(5) NOT NULL,
        stall_id    VARCHAR(4) NOT NULL,
        item_code   VARCHAR(10) NOT NULL
    );

    INSERT #LikeSeed
      (customer_id, stall_id, item_code)
    VALUES
      /* First pass: 51 likes, at least 1 like for each seeded MenuItem */
      ('C0001', '1', '1'),
      ('C0002', '1', '2'),
      ('C0003', '1', '3'),
      ('C0004', '1', '4'),
      ('C0001', '1', '5'),
      ('C0002', '1', '6'),

      ('C0003', '2', '7'),
      ('C0004', '2', '8'),
      ('C0001', '2', '9'),
      ('C0002', '2', '10'),
      ('C0003', '2', '11'),

      ('C0004', '3', '12'),
      ('C0001', '3', '13'),
      ('C0002', '3', '14'),
      ('C0003', '3', '15'),
      ('C0004', '3', '16'),

      ('C0001', '4', '17'),
      ('C0002', '4', '18'),
      ('C0003', '4', '19'),
      ('C0004', '4', '20'),
      ('C0001', '4', '21'),

      ('C0002', '5', '22'),
      ('C0003', '5', '23'),
      ('C0004', '5', '24'),
      ('C0001', '5', '25'),
      ('C0002', '5', '26'),

      ('C0003', '6', '27'),
      ('C0004', '6', '28'),
      ('C0001', '6', '29'),
      ('C0002', '6', '30'),
      ('C0003', '6', '31'),

      ('C0004', '7', '32'),
      ('C0001', '7', '33'),
      ('C0002', '7', '34'),
      ('C0003', '7', '35'),
      ('C0004', '7', '36'),

      ('C0001', '8', '37'),
      ('C0002', '8', '38'),
      ('C0003', '8', '39'),
      ('C0004', '8', '40'),
      ('C0001', '8', '41'),

      ('C0002', '9', '42'),
      ('C0003', '9', '43'),
      ('C0004', '9', '44'),
      ('C0001', '9', '45'),
      ('C0002', '9', '46'),

      ('C0003', '10', '47'),
      ('C0004', '10', '48'),
      ('C0001', '10', '49'),
      ('C0002', '10', '50'),
      ('C0003', '10', '51'),

      /* Second pass: extra 49 likes to make 100 total seed rows */
      ('C0002', '1', '1'),
      ('C0003', '1', '2'),
      ('C0004', '1', '3'),
      ('C0001', '1', '4'),
      ('C0002', '1', '5'),
      ('C0003', '1', '6'),

      ('C0004', '2', '7'),
      ('C0001', '2', '8'),
      ('C0002', '2', '9'),
      ('C0003', '2', '10'),
      ('C0004', '2', '11'),

      ('C0001', '3', '12'),
      ('C0002', '3', '13'),
      ('C0003', '3', '14'),
      ('C0004', '3', '15'),
      ('C0001', '3', '16'),

      ('C0002', '4', '17'),
      ('C0003', '4', '18'),
      ('C0004', '4', '19'),
      ('C0001', '4', '20'),
      ('C0002', '4', '21'),

      ('C0003', '5', '22'),
      ('C0004', '5', '23'),
      ('C0001', '5', '24'),
      ('C0002', '5', '25'),
      ('C0003', '5', '26'),

      ('C0004', '6', '27'),
      ('C0001', '6', '28'),
      ('C0002', '6', '29'),
      ('C0003', '6', '30'),
      ('C0004', '6', '31'),

      ('C0001', '7', '32'),
      ('C0002', '7', '33'),
      ('C0003', '7', '34'),
      ('C0004', '7', '35'),
      ('C0001', '7', '36'),

      ('C0002', '8', '37'),
      ('C0003', '8', '38'),
      ('C0004', '8', '39'),
      ('C0001', '8', '40'),
      ('C0002', '8', '41'),

      ('C0003', '9', '42'),
      ('C0004', '9', '43'),
      ('C0001', '9', '44'),
      ('C0002', '9', '45'),
      ('C0003', '9', '46'),

      ('C0004', '10', '47'),
      ('C0001', '10', '48'),
      ('C0002', '10', '49');

    /*
      Insert into dbo.Likes only after confirming that:
      - #LikeSeed.customer_id exists in dbo.Customer.CustomerID
      - #LikeSeed.stall_id + #LikeSeed.item_code exists in dbo.MenuItem.StallID + dbo.MenuItem.ItemCode
    */
    INSERT dbo.Likes
      (CustomerID, StallID, ItemCode)
    SELECT
        ls.customer_id,
        ls.stall_id,
        ls.item_code
    FROM #LikeSeed ls
    JOIN dbo.Customer c
      ON c.CustomerID = ls.customer_id
    JOIN dbo.MenuItem mi
      ON mi.StallID = ls.stall_id
     AND mi.ItemCode = ls.item_code
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.Likes existing_like
        WHERE existing_like.CustomerID = ls.customer_id
          AND existing_like.StallID = ls.stall_id
          AND existing_like.ItemCode = ls.item_code
    );



    /* ================================================================
       6. Eight active promotions and same-stall item links
       Wide demo period: 2026-01-01 through 2030-12-31.
       ================================================================ */
    CREATE TABLE #PromotionSeed (
        centre_address  NVARCHAR(250) NOT NULL,
        unit_number     NVARCHAR(20)  NOT NULL,
        promotion_name  NVARCHAR(150) NOT NULL,
        description     NVARCHAR(500) NOT NULL,
        discount_type   VARCHAR(12) NOT NULL,
        discount_value  DECIMAL(10,2) NOT NULL
    );

    INSERT #PromotionSeed
      (centre_address, unit_number, promotion_name, description,
       discount_type, discount_value)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01',
       N'Sam Lunch Special', N'15% off selected chicken-rice dishes.',
       'Percentage', 15.00),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02',
       N'Noodle Combo Discount', N'$1 off selected noodle favourites.',
       'Fixed', 1.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01',
       N'Tampines Meal Deal', N'10% off all available items at this stall.',
       'Percentage', 10.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02',
       N'Western Lunch Savings', N'$2 off selected western lunch dishes.',
       'Fixed', 2.00),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03',
       N'Dessert Happy Hour', N'20% off selected desserts.',
       'Percentage', 20.00),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01',
       N'Vegetarian Week', N'10% off all available items at this stall.',
       'Percentage', 10.00),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02',
       N'Golden Wok Special', N'$1.50 off selected Golden Wok dishes.',
       'Fixed', 1.50),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01',
       N'Northside Dinner Deal', N'12% off selected Malay main dishes.',
       'Percentage', 12.00);

    MERGE dbo.promotions AS target
    USING (
        SELECT
            s.stall_id,
            ps.promotion_name,
            ps.description,
            ps.discount_type,
            ps.discount_value
        FROM #PromotionSeed ps
        JOIN dbo.hawker_centres hc ON hc.address = ps.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ps.unit_number
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.name = source.promotion_name
    WHEN MATCHED THEN
      UPDATE SET
        target.description = source.description,
        target.discount_type = source.discount_type,
        target.discount_value = source.discount_value,
        target.start_date = '2026-01-01',
        target.end_date = '2030-12-31',
        target.is_active = 1,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id, name, description, discount_type, discount_value,
        start_date, end_date, is_active
      )
      VALUES (
        source.stall_id, source.promotion_name, source.description,
        source.discount_type, source.discount_value,
        '2026-01-01', '2030-12-31', 1
      );

    CREATE TABLE #PromotionItemSeed (
        centre_address  NVARCHAR(250) NOT NULL,
        unit_number     NVARCHAR(20)  NOT NULL,
        promotion_name  NVARCHAR(150) NOT NULL,
        item_name       NVARCHAR(150) NOT NULL
    );

    INSERT #PromotionItemSeed
      (centre_address, unit_number, promotion_name, item_name)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sam Lunch Special', N'Sample Chicken Rice'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sam Lunch Special', N'Roasted Chicken Rice'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'Sam Lunch Special', N'Steamed Chicken Rice'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Noodle Combo Discount', N'Fishball Noodles'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'Noodle Combo Discount', N'Minced Meat Noodles'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Western Lunch Savings', N'Chicken Chop'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'Western Lunch Savings', N'Fish and Chips'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Dessert Happy Hour', N'Ice Kachang'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Dessert Happy Hour', N'Chendol'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'Dessert Happy Hour', N'Mango Sago'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Golden Wok Special', N'Wanton Noodles'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'Golden Wok Special', N'Dumpling Noodles'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Northside Dinner Deal', N'Nasi Padang'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'Northside Dinner Deal', N'Beef Rendang Rice');

    /* These two named seed promotions are intentionally whole-stall offers.
       Clear only their item links so reruns preserve the required meaning.
       Also remove invalid cross-stall links from the eight named demo offers. */
    DELETE pmi
    FROM dbo.promotion_menu_items pmi
    JOIN dbo.promotions p ON p.promotion_id = pmi.promotion_id
    JOIN dbo.menu_items linked_item ON linked_item.menu_item_id = pmi.menu_item_id
    JOIN dbo.stalls s ON s.stall_id = p.stall_id
    JOIN dbo.hawker_centres hc ON hc.centre_id = s.centre_id
    JOIN #PromotionSeed ps
      ON ps.centre_address = hc.address
     AND ps.unit_number = s.unit_number
     AND ps.promotion_name = p.name
    WHERE ps.promotion_name IN (N'Tampines Meal Deal', N'Vegetarian Week')
       OR linked_item.stall_id <> p.stall_id;

    INSERT dbo.promotion_menu_items (promotion_id, menu_item_id)
    SELECT p.promotion_id, mi.menu_item_id
    FROM #PromotionItemSeed pis
    JOIN dbo.hawker_centres hc ON hc.address = pis.centre_address
    JOIN dbo.stalls s
      ON s.centre_id = hc.centre_id AND s.unit_number = pis.unit_number
    JOIN dbo.promotions p
      ON p.stall_id = s.stall_id AND p.name = pis.promotion_name
    JOIN dbo.menu_items mi
      ON mi.stall_id = s.stall_id AND mi.name = pis.item_name
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.promotion_menu_items existing_link
        WHERE existing_link.promotion_id = p.promotion_id
          AND existing_link.menu_item_id = mi.menu_item_id
    );

    /* ================================================================
       7. Centre crowd updates and one inspection per seeded stall
       ================================================================ */
    CREATE TABLE #CrowdSeed (
        centre_address   NVARCHAR(250) NOT NULL,
        percentage       TINYINT NOT NULL,
        crowd_label      VARCHAR(20) NOT NULL,
        estimated_seats  INT NOT NULL
    );

    INSERT #CrowdSeed
      (centre_address, percentage, crowd_label, estimated_seats)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', 35, 'Moderate', 156),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', 62, 'High', 74),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', 28, 'Low', 132),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', 48, 'Moderate', 96);

    INSERT dbo.crowd_updates
      (centre_id, percentage, crowd_label, estimated_seats)
    SELECT hc.centre_id, cs.percentage, cs.crowd_label, cs.estimated_seats
    FROM #CrowdSeed cs
    JOIN dbo.hawker_centres hc ON hc.address = cs.centre_address
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.crowd_updates cu
        WHERE cu.centre_id = hc.centre_id
    );

    CREATE TABLE #InspectionSeed (
        centre_address       NVARCHAR(250) NOT NULL,
        unit_number          NVARCHAR(20)  NOT NULL,
        inspection_date      DATE NOT NULL,
        grade                CHAR(1) NOT NULL,
        score                DECIMAL(5,2) NOT NULL,
        remarks              NVARCHAR(500) NOT NULL,
        valid_until          DATE NOT NULL,
        officer_email        NVARCHAR(254) NOT NULL,
        legacy_inspection_id VARCHAR(10) NOT NULL
    );

    INSERT #InspectionSeed
      (centre_address, unit_number, inspection_date, grade, score, remarks,
       valid_until, officer_email, legacy_inspection_id)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', '2026-07-15', 'A', 92.00, N'Clean preparation area and correct food storage.', '2027-07-14', N'ninanea@gmail.com', 'DINSP00001'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', '2026-07-16', 'A', 90.00, N'Food handling and work surfaces met requirements.', '2027-07-15', N'nea02@test.com', 'DINSP00002'),
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', '2026-07-17', 'B', 84.00, N'Beverage preparation area was satisfactory.', '2027-07-16', N'ninanea@gmail.com', 'DINSP00003'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', '2026-07-18', 'A', 93.00, N'Good temperature control and clean equipment.', '2027-07-17', N'nea02@test.com', 'DINSP00004'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', '2026-07-19', 'B', 86.00, N'Grill and cold-storage areas were maintained.', '2027-07-18', N'ninanea@gmail.com', 'DINSP00005'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', '2026-07-20', 'A', 91.00, N'Dessert ingredients were labelled and stored correctly.', '2027-07-19', N'nea02@test.com', 'DINSP00006'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', '2026-07-21', 'A', 94.00, N'Preparation area was orderly and sanitary.', '2027-07-20', N'ninanea@gmail.com', 'DINSP00007'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', '2026-07-22', 'B', 85.00, N'Cooking and storage controls were satisfactory.', '2027-07-21', N'nea02@test.com', 'DINSP00008'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', '2026-07-23', 'A', 90.00, N'No critical hygiene issues observed.', '2027-07-22', N'ninanea@gmail.com', 'DINSP00009'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', '2026-07-24', 'A', 95.00, N'Excellent cleanliness and food-storage practices.', '2027-07-23', N'nea02@test.com', 'DINSP00010');

    MERGE dbo.inspections AS target
    USING (
        SELECT
            s.stall_id,
            ins.inspection_date,
            ins.grade,
            ins.score,
            ins.remarks,
            ins.valid_until
        FROM #InspectionSeed ins
        JOIN dbo.hawker_centres hc ON hc.address = ins.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ins.unit_number
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.inspection_date = source.inspection_date
    WHEN MATCHED THEN
      UPDATE SET
        target.grade = source.grade,
        target.score = source.score,
        target.status = 'Completed',
        target.remarks = source.remarks,
        target.valid_until = source.valid_until,
        target.updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id, inspection_date, grade, score, status, remarks, valid_until
      )
      VALUES (
        source.stall_id, source.inspection_date, source.grade, source.score,
        'Completed', source.remarks, source.valid_until
      );

    MERGE dbo.Inspection AS target
    USING (
        SELECT
            ins.legacy_inspection_id,
            ins.inspection_date,
            ins.valid_until,
            ins.grade,
            officer_profile.OfficerID,
            fs.StallID
        FROM #InspectionSeed ins
        JOIN dbo.hawker_centres hc ON hc.address = ins.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ins.unit_number
        JOIN dbo.FoodStall fs ON fs.LinkedStallID = s.stall_id
        JOIN dbo.users officer_user
          ON officer_user.email_normalized = LOWER(ins.officer_email)
        JOIN dbo.NEA_Officer officer_profile
          ON officer_profile.LinkedUserID = officer_user.user_id
    ) AS source
      ON target.InspectionID = source.legacy_inspection_id
    WHEN MATCHED THEN
      UPDATE SET
        target.InspectionDate = source.inspection_date,
        target.GradeExpiry = source.valid_until,
        target.HygieneGrade = source.grade,
        target.OfficerID = source.OfficerID,
        target.StallID = source.StallID
    WHEN NOT MATCHED THEN
      INSERT (
        InspectionID, InspectionDate, GradeExpiry,
        HygieneGrade, OfficerID, StallID
      )
      VALUES (
        source.legacy_inspection_id, source.inspection_date,
        source.valid_until, source.grade, source.OfficerID, source.StallID
      );

    MERGE dbo.InspectionRemark AS target
    USING (
        SELECT legacy_inspection_id, remarks
        FROM #InspectionSeed
    ) AS source
      ON target.InspectionID = source.legacy_inspection_id
    WHEN MATCHED THEN
      UPDATE SET target.InspectionRemark = source.remarks
    WHEN NOT MATCHED THEN
      INSERT (InspectionID, InspectionRemark)
      VALUES (source.legacy_inspection_id, source.remarks);

    /* ================================================================
       8. Several normalized complaints
       ================================================================ */
    CREATE TABLE #ComplaintSeed (
        centre_address  NVARCHAR(250) NOT NULL,
        unit_number     NVARCHAR(20)  NOT NULL,
        customer_email  NVARCHAR(254) NOT NULL,
        category        NVARCHAR(80)  NOT NULL,
        description     NVARCHAR(1000) NOT NULL,
        status          VARCHAR(20) NOT NULL
    );

    INSERT #ComplaintSeed
      (centre_address, unit_number, customer_email, category, description, status)
    VALUES
      (N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'demo.customer01@test.com', N'Waiting Time', N'Demo complaint: order took longer than the displayed preparation time.', 'Under Review'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'demo.customer02@test.com', N'Order Accuracy', N'Demo complaint: requested sauce was missing from the packed order.', 'Resolved'),
      (N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'demo.customer03@test.com', N'Product Quality', N'Demo complaint: dessert contained less topping than expected.', 'Submitted'),
      (N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'demo.customer04@test.com', N'Service', N'Demo complaint: clarification about an ingredient was not answered clearly.', 'Under Review'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'demo.customer01@test.com', N'Packaging', N'Demo complaint: takeaway container was not sealed securely.', 'Resolved'),
      (N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'demo.customer02@test.com', N'Waiting Time', N'Demo complaint: collection queue moved slowly during dinner.', 'Submitted');

    INSERT dbo.complaints
      (stall_id, customer_id, category, description, status)
    SELECT
        s.stall_id,
        c.user_id,
        cs.category,
        cs.description,
        cs.status
    FROM #ComplaintSeed cs
    JOIN dbo.hawker_centres hc ON hc.address = cs.centre_address
    JOIN dbo.stalls s
      ON s.centre_id = hc.centre_id AND s.unit_number = cs.unit_number
    JOIN dbo.users c ON c.email_normalized = LOWER(cs.customer_email)
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.complaints existing_complaint
        WHERE existing_complaint.stall_id = s.stall_id
          AND existing_complaint.customer_id = c.user_id
          AND existing_complaint.category = cs.category
          AND existing_complaint.description = cs.description
    );

    /* ================================================================
       9. Hybrid normalized/legacy feedback records
       ================================================================ */
    CREATE TABLE #FeedbackSeed (
        feedback_key    VARCHAR(10) NOT NULL,
        centre_address  NVARCHAR(250) NOT NULL,
        unit_number     NVARCHAR(20)  NOT NULL,
        customer_email  NVARCHAR(254) NOT NULL,
        category        NVARCHAR(80) NOT NULL,
        subcategory     NVARCHAR(80) NOT NULL,
        comment         NVARCHAR(400) NOT NULL,
        rating          TINYINT NOT NULL,
        feedback_time   DATETIME2(0) NOT NULL
    );

    INSERT #FeedbackSeed
      (feedback_key, centre_address, unit_number, customer_email,
       category, subcategory, comment, rating, feedback_time)
    VALUES
      ('DFB0000001', N'448 Clementi Avenue 3, Singapore 120448', N'#01-01', N'demo.customer01@test.com', N'Food', N'Taste', N'Demo feedback: chicken rice was fragrant and well prepared.', 5, '2026-07-25T12:15:00'),
      ('DFB0000002', N'448 Clementi Avenue 3, Singapore 120448', N'#01-02', N'demo.customer02@test.com', N'Food', N'Portion', N'Demo feedback: noodle portion was good for the price.', 4, '2026-07-26T13:05:00'),
      ('DFB0000003', N'448 Clementi Avenue 3, Singapore 120448', N'#01-03', N'demo.customer03@test.com', N'Drink', N'Freshness', N'Demo feedback: lime juice was refreshing.', 4, '2026-07-27T15:20:00'),
      ('DFB0000004', N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-01', N'demo.customer04@test.com', N'Food', N'Taste', N'Demo feedback: nasi lemak sambal had a balanced flavour.', 5, '2026-07-28T11:45:00'),
      ('DFB0000005', N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-02', N'demo.customer01@test.com', N'Food', N'Value', N'Demo feedback: chicken chop was satisfying and good value.', 4, '2026-07-29T12:35:00'),
      ('DFB0000006', N'DEMO LOCATION ONLY - Tampines Central, Singapore', N'#01-03', N'demo.customer02@test.com', N'Dessert', N'Taste', N'Demo feedback: mango sago was chilled and smooth.', 5, '2026-07-30T16:10:00'),
      ('DFB0000007', N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-01', N'demo.customer03@test.com', N'Food', N'Variety', N'Demo feedback: vegetarian menu had several useful choices.', 4, '2026-07-31T12:00:00'),
      ('DFB0000008', N'DEMO LOCATION ONLY - Jurong East, Singapore', N'#01-02', N'demo.customer04@test.com', N'Food', N'Taste', N'Demo feedback: wanton noodles were springy and flavourful.', 5, '2026-08-01T13:30:00'),
      ('DFB0000009', N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-01', N'demo.customer01@test.com', N'Food', N'Other', N'Demo feedback: food looked very appetizing and tasted good.', 5, '2026-08-02T19:10:00'),
      ('DFB0000010', N'DEMO LOCATION ONLY - Woodlands, Singapore', N'#01-02', N'demo.customer02@test.com', N'Food', N'Aroma', N'Demo feedback: chicken biryani was aromatic.', 4, '2026-08-03T18:40:00');

    MERGE dbo.Feedback AS target
    USING (
        SELECT
            fbs.feedback_key,
            fbs.category,
            fbs.subcategory,
            fbs.comment,
            fbs.feedback_time,
            fbs.rating,
            customer_profile.CustomerID,
            fs.StallID,
            s.stall_id
        FROM #FeedbackSeed fbs
        JOIN dbo.hawker_centres hc ON hc.address = fbs.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = fbs.unit_number
        JOIN dbo.FoodStall fs ON fs.LinkedStallID = s.stall_id
        JOIN dbo.users customer_user
          ON customer_user.email_normalized = LOWER(fbs.customer_email)
        JOIN dbo.Customer customer_profile
          ON customer_profile.LinkedUserID = customer_user.user_id
    ) AS source
      ON target.FbkID = source.feedback_key
    WHEN MATCHED THEN
      UPDATE SET
        target.Category = source.category,
        target.Subcategory = source.subcategory,
        target.FbkComment = source.comment,
        target.FbkDateTime = source.feedback_time,
        target.FbkRating = source.rating,
        target.CustomerID = source.CustomerID,
        target.StallID = source.StallID,
        target.stall_id = source.stall_id,
        target.overall_rating = CONVERT(DECIMAL(3,2), source.rating)
    WHEN NOT MATCHED THEN
      INSERT (
        FbkID, Category, Subcategory, FbkComment, FbkDateTime,
        FbkRating, CustomerID, StallID, stall_id, overall_rating
      )
      VALUES (
        source.feedback_key, source.category, source.subcategory,
        source.comment, source.feedback_time, source.rating,
        source.CustomerID, source.StallID, source.stall_id,
        CONVERT(DECIMAL(3,2), source.rating)
      );

    /* ================================================================
       10. Transactional validation of all explicit minimums
       ================================================================ */
    IF (SELECT COUNT(*) FROM dbo.hawker_centres WHERE is_active = 1) < 4
        THROW 52010, 'Validation failed: fewer than four active centres.', 1;

    IF (
        SELECT COUNT(*)
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id
         AND s.unit_number = ss.unit_number
         AND s.is_active = 1
    ) <> 10
        THROW 52011, 'Validation failed: the ten seeded stalls are not all active.', 1;

    IF (
        SELECT COUNT(*)
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        WHERE us.role_name = N'Vendor' AND u.account_status = 'Active'
    ) < 3
        THROW 52012, 'Validation failed: fewer than three active demo vendors.', 1;

    IF (
        SELECT COUNT(*)
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        WHERE us.role_name = N'Operator' AND u.account_status = 'Active'
    ) < 2
        THROW 52013, 'Validation failed: fewer than two active demo operators.', 1;

    IF (
        SELECT COUNT(*)
        FROM #UserSeed us
        JOIN dbo.users u ON u.email_normalized = LOWER(us.email)
        WHERE us.role_name = N'NEA Officer' AND u.account_status = 'Active'
    ) < 2
        THROW 52014, 'Validation failed: fewer than two active demo NEA officers.', 1;

    IF EXISTS (
        SELECT s.stall_id
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        LEFT JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.is_available = 1
        GROUP BY s.stall_id
        HAVING COUNT(mi.menu_item_id) < 4
    )
        THROW 52015, 'Validation failed: a seeded stall has fewer than four available menu items.', 1;

    IF (
        SELECT COUNT(*)
        FROM #MenuSeed ms
        JOIN dbo.hawker_centres hc ON hc.address = ms.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ms.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id
         AND mi.name = ms.item_name
         AND mi.is_available = 1
    ) < 40
        THROW 52016, 'Validation failed: fewer than forty available seeded menu items.', 1;

    IF EXISTS (
        SELECT 1
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.stall_cuisines sc
            WHERE sc.stall_id = s.stall_id
        )
    )
        THROW 52017, 'Validation failed: a seeded stall has no cuisine.', 1;

    IF EXISTS (
        SELECT 1
        FROM #MenuSeed ms
        JOIN dbo.hawker_centres hc ON hc.address = ms.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ms.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.name = ms.item_name
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.menu_item_cuisines mic
            WHERE mic.menu_item_id = mi.menu_item_id
        )
    )
        THROW 52018, 'Validation failed: a seeded menu item has no cuisine.', 1;

    IF (
        SELECT COUNT(*)
        FROM #AddOnSeed aos
        JOIN dbo.hawker_centres hc ON hc.address = aos.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = aos.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.name = aos.item_name
        JOIN dbo.menu_add_ons mao
          ON mao.menu_item_id = mi.menu_item_id
         AND mao.name = aos.add_on_name
         AND mao.is_available = 1
    ) < 15
        THROW 52019, 'Validation failed: fewer than fifteen available seeded add-ons.', 1;

    IF (
        SELECT COUNT(*)
        FROM #PromotionSeed ps
        JOIN dbo.hawker_centres hc ON hc.address = ps.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ps.unit_number
        JOIN dbo.promotions p
          ON p.stall_id = s.stall_id
         AND p.name = ps.promotion_name
         AND p.is_active = 1
         AND CONVERT(DATE, GETDATE()) BETWEEN p.start_date AND p.end_date
    ) < 8
        THROW 52020, 'Validation failed: fewer than eight currently active seeded promotions.', 1;

    IF (
        SELECT COUNT(*)
        FROM #PromotionSeed ps
        JOIN dbo.hawker_centres hc ON hc.address = ps.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ps.unit_number
        JOIN dbo.promotions p
          ON p.stall_id = s.stall_id AND p.name = ps.promotion_name
        WHERE EXISTS (
            SELECT 1 FROM dbo.promotion_menu_items pmi
            WHERE pmi.promotion_id = p.promotion_id
        )
    ) < 4
        THROW 52021, 'Validation failed: fewer than four item-specific promotions.', 1;

    IF (
        SELECT COUNT(*)
        FROM #PromotionSeed ps
        JOIN dbo.hawker_centres hc ON hc.address = ps.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ps.unit_number
        JOIN dbo.promotions p
          ON p.stall_id = s.stall_id AND p.name = ps.promotion_name
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.promotion_menu_items pmi
            WHERE pmi.promotion_id = p.promotion_id
        )
    ) < 2
        THROW 52022, 'Validation failed: fewer than two whole-stall promotions.', 1;

    IF EXISTS (
        SELECT 1
        FROM #PromotionSeed ps
        JOIN dbo.hawker_centres hc ON hc.address = ps.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ps.unit_number
        JOIN dbo.promotions p
          ON p.stall_id = s.stall_id AND p.name = ps.promotion_name
        JOIN dbo.promotion_menu_items pmi ON pmi.promotion_id = p.promotion_id
        JOIN dbo.menu_items mi ON mi.menu_item_id = pmi.menu_item_id
        WHERE p.stall_id <> mi.stall_id
    )
        THROW 52023, 'Validation failed: a promotion is linked to another stall''s menu item.', 1;

    IF EXISTS (
        SELECT 1
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.inspections i
            WHERE i.stall_id = s.stall_id
        )
           OR NOT EXISTS (
            SELECT 1 FROM dbo.stall_operations so
            WHERE so.stall_id = s.stall_id
        )
           OR NOT EXISTS (
            SELECT 1 FROM dbo.rental_agreements ra
            WHERE ra.stall_id = s.stall_id AND ra.status = 'Active'
        )
    )
        THROW 52024, 'Validation failed: a seeded stall lacks an inspection, operation row or active rental.', 1;

    IF EXISTS (
        SELECT 1
        FROM #CentreSeed cs
        JOIN dbo.hawker_centres hc ON hc.address = cs.address
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.crowd_updates cu
            WHERE cu.centre_id = hc.centre_id
        )
    )
        THROW 52025, 'Validation failed: a seeded centre has no crowd update.', 1;

    IF (
        SELECT COUNT(*)
        FROM #FeedbackSeed fbs
        JOIN dbo.Feedback f ON f.FbkID = fbs.feedback_key
    ) < 6
        THROW 52026, 'Validation failed: fewer than six seeded feedback records.', 1;

    IF (
        SELECT COUNT(*)
        FROM #ComplaintSeed cs
        JOIN dbo.hawker_centres hc ON hc.address = cs.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = cs.unit_number
        JOIN dbo.users c ON c.email_normalized = LOWER(cs.customer_email)
        JOIN dbo.complaints comp
          ON comp.stall_id = s.stall_id
         AND comp.customer_id = c.user_id
         AND comp.description = cs.description
    ) < 6
        THROW 52027, 'Validation failed: fewer than six seeded complaints.', 1;

    IF EXISTS (
        SELECT 1
        FROM #StallSeed ss
        JOIN dbo.hawker_centres hc ON hc.address = ss.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ss.unit_number
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.FoodStall fs
            WHERE fs.LinkedStallID = s.stall_id
        )
    )
        THROW 52028, 'Validation failed: legacy FoodStall bridge records are missing.', 1;

    IF EXISTS (
        SELECT 1
        FROM #MenuSeed ms
        JOIN dbo.hawker_centres hc ON hc.address = ms.centre_address
        JOIN dbo.stalls s
          ON s.centre_id = hc.centre_id AND s.unit_number = ms.unit_number
        JOIN dbo.menu_items mi
          ON mi.stall_id = s.stall_id AND mi.name = ms.item_name
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.MenuItem legacy_item
            WHERE legacy_item.LinkedMenuItemID = mi.menu_item_id
        )
    )
        THROW 52029, 'Validation failed: legacy MenuItem bridge records are missing.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
/* ================================================================
   Additional stall: Than Thar Local Kitchen
   Assigned vendor: Sam Vendor — vendor01@test.com
   ================================================================ */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ThanTharCentreId INT;
    DECLARE @ThanTharVendorId INT;
    DECLARE @ThanTharCuisineId INT;
    DECLARE @ThanTharStallId INT;

    /* Find Clementi 448 Market & Food Centre. */
    SELECT @ThanTharCentreId = hc.centre_id
    FROM dbo.hawker_centres AS hc
    WHERE hc.address =
          N'448 Clementi Avenue 3, Singapore 120448';

    /* Find Sam Vendor using the vendor's email and role. */
    SELECT @ThanTharVendorId = u.user_id
    FROM dbo.users AS u
    INNER JOIN dbo.roles AS r
        ON r.role_id = u.role_id
    WHERE u.email_normalized = LOWER(N'vendor01@test.com')
      AND r.role_name = N'Vendor'
      AND u.account_status = 'Active';

    /* Find the Chinese cuisine record. */
    SELECT @ThanTharCuisineId = c.cuisine_id
    FROM dbo.cuisines AS c
    WHERE c.name = N'Chinese';

    /* Validate required records. */
    IF @ThanTharCentreId IS NULL
    BEGIN
        THROW 52110,
          'Clementi 448 Market & Food Centre was not found.',
          1;
    END;

    IF @ThanTharVendorId IS NULL
    BEGIN
        THROW 52111,
          'Active vendor vendor01@test.com was not found.',
          1;
    END;

    IF @ThanTharCuisineId IS NULL
    BEGIN
        THROW 52112,
          'Chinese cuisine was not found.',
          1;
    END;

    /* Create the stall, or update it if it already exists. */
    MERGE dbo.stalls AS target
    USING (
        SELECT
            @ThanTharCentreId AS centre_id,
            N'#01-04' AS unit_number,
            N'Than Thar Local Kitchen' AS stall_name,
            N'Local Singapore dishes, rice meals and beverages.'
                AS description,
            N'08:00-20:00' AS opening_hours
    ) AS source
      ON target.centre_id = source.centre_id
     AND target.unit_number = source.unit_number

    WHEN MATCHED THEN
      UPDATE SET
        target.name = source.stall_name,
        target.description = source.description,
        target.opening_hours = source.opening_hours,
        target.is_active = 1,
        target.updated_at = SYSUTCDATETIME()

    WHEN NOT MATCHED THEN
      INSERT (
          centre_id,
          name,
          unit_number,
          description,
          opening_hours,
          is_active
      )
      VALUES (
          source.centre_id,
          source.stall_name,
          source.unit_number,
          source.description,
          source.opening_hours,
          1
      );

    /* Obtain the generated stall ID without assuming it is 11. */
    SELECT @ThanTharStallId = s.stall_id
    FROM dbo.stalls AS s
    WHERE s.centre_id = @ThanTharCentreId
      AND s.unit_number = N'#01-04';

    IF @ThanTharStallId IS NULL
    BEGIN
        THROW 52113,
          'Than Thar Local Kitchen could not be created.',
          1;
    END;

    /*
       Stop the script if this unit is currently assigned to a
       different active vendor.
    */
    IF EXISTS (
        SELECT 1
        FROM dbo.stall_owners AS so
        WHERE so.stall_id = @ThanTharStallId
          AND so.end_date IS NULL
          AND so.vendor_id <> @ThanTharVendorId
    )
    BEGIN
        THROW 52114,
          'Unit #01-04 is already assigned to another active vendor.',
          1;
    END;

    /* Assign the stall to Sam Vendor if not already assigned. */
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.stall_owners AS so
        WHERE so.stall_id = @ThanTharStallId
          AND so.vendor_id = @ThanTharVendorId
          AND so.end_date IS NULL
    )
    BEGIN
        INSERT INTO dbo.stall_owners (
            stall_id,
            vendor_id,
            start_date,
            end_date
        )
        VALUES (
            @ThanTharStallId,
            @ThanTharVendorId,
            CAST('2026-08-05' AS DATE),
            NULL
        );
    END;

    /* Make Chinese the primary cuisine. */
    UPDATE dbo.stall_cuisines
    SET is_primary = 0
    WHERE stall_id = @ThanTharStallId
      AND cuisine_id <> @ThanTharCuisineId
      AND is_primary = 1;

    MERGE dbo.stall_cuisines AS target
    USING (
        SELECT
            @ThanTharStallId AS stall_id,
            @ThanTharCuisineId AS cuisine_id
    ) AS source
      ON target.stall_id = source.stall_id
     AND target.cuisine_id = source.cuisine_id

    WHEN MATCHED THEN
      UPDATE SET target.is_primary = 1

    WHEN NOT MATCHED THEN
      INSERT (
          stall_id,
          cuisine_id,
          is_primary
      )
      VALUES (
          source.stall_id,
          source.cuisine_id,
          1
      );

    /* Set the stall's operational status to Open. */
    MERGE dbo.stall_operations AS target
    USING (
        SELECT @ThanTharStallId AS stall_id
    ) AS source
      ON target.stall_id = source.stall_id

    WHEN MATCHED THEN
      UPDATE SET
        target.operational_status = 'Open',
        target.maintenance_note =
            N'Additional stall created through the project SQL seed.',
        target.updated_at = SYSUTCDATETIME()

    WHEN NOT MATCHED THEN
      INSERT (
          stall_id,
          operational_status,
          maintenance_note,
          updated_by
      )
      VALUES (
          source.stall_id,
          'Open',
          N'Additional stall created through the project SQL seed.',
          NULL
      );

    /*
       Refresh the legacy FoodStall owner bridge even when the
       normalized ownership record already existed.
    */
    UPDATE dbo.stall_owners
    SET created_at = created_at
    WHERE stall_id = @ThanTharStallId
      AND vendor_id = @ThanTharVendorId
      AND end_date IS NULL;

    COMMIT TRANSACTION;

    PRINT 'Than Thar Local Kitchen created or updated successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

/* ================================================================
   Verify Than Thar Local Kitchen
   ================================================================ */

SELECT
    s.stall_id,
    s.name AS stall_name,
    s.unit_number,
    s.description,
    s.opening_hours,
    s.is_active,
    hc.name AS hawker_centre,
    hc.town,
    u.user_id AS vendor_id,
    u.full_name AS vendor_name,
    u.email AS vendor_email,
    so.start_date,
    so.end_date,
    c.name AS cuisine,
    sc.is_primary,
    ops.operational_status
FROM dbo.stalls AS s
INNER JOIN dbo.hawker_centres AS hc
    ON hc.centre_id = s.centre_id
INNER JOIN dbo.stall_owners AS so
    ON so.stall_id = s.stall_id
   AND so.end_date IS NULL
INNER JOIN dbo.users AS u
    ON u.user_id = so.vendor_id
LEFT JOIN dbo.stall_cuisines AS sc
    ON sc.stall_id = s.stall_id
LEFT JOIN dbo.cuisines AS c
    ON c.cuisine_id = sc.cuisine_id
LEFT JOIN dbo.stall_operations AS ops
    ON ops.stall_id = s.stall_id
WHERE hc.address =
      N'448 Clementi Avenue 3, Singapore 120448'
  AND s.unit_number = N'#01-04';
GO

/* ================================================================
   Verification output for SSMS
   ================================================================ */
SELECT
    (SELECT COUNT(*) FROM dbo.hawker_centres WHERE is_active = 1)
      AS ActiveCentres,
    (SELECT COUNT(*) FROM dbo.stalls WHERE is_active = 1)
      AS ActiveStalls,
    (SELECT COUNT(*) FROM dbo.menu_items WHERE is_available = 1)
      AS AvailableMenuItems,
    (SELECT COUNT(*) FROM dbo.menu_add_ons WHERE is_available = 1)
      AS AvailableAddOns,
    (SELECT COUNT(*) FROM dbo.promotions
      WHERE is_active = 1
        AND CONVERT(DATE, GETDATE()) BETWEEN start_date AND end_date)
      AS CurrentlyActivePromotions;

SELECT
    hc.name AS centre_name,
    hc.address,
    s.name AS stall_name,
    s.unit_number,
    vendor.full_name AS vendor_name,
    vendor.email AS vendor_email,
    so.operational_status,
    COUNT(DISTINCT mi.menu_item_id) AS menu_item_count,
    latest_inspection.grade AS latest_hygiene_grade
FROM dbo.hawker_centres hc
JOIN dbo.stalls s ON s.centre_id = hc.centre_id
LEFT JOIN dbo.stall_owners owner_link
  ON owner_link.stall_id = s.stall_id AND owner_link.end_date IS NULL
LEFT JOIN dbo.users vendor ON vendor.user_id = owner_link.vendor_id
LEFT JOIN dbo.stall_operations so ON so.stall_id = s.stall_id
LEFT JOIN dbo.menu_items mi
  ON mi.stall_id = s.stall_id AND mi.is_available = 1
OUTER APPLY (
    SELECT TOP (1) i.grade
    FROM dbo.inspections i
    WHERE i.stall_id = s.stall_id AND i.status = 'Completed'
    ORDER BY i.inspection_date DESC, i.inspection_id DESC
) latest_inspection
WHERE hc.address IN (
    N'448 Clementi Avenue 3, Singapore 120448',
    N'DEMO LOCATION ONLY - Tampines Central, Singapore',
    N'DEMO LOCATION ONLY - Jurong East, Singapore',
    N'DEMO LOCATION ONLY - Woodlands, Singapore'
)
GROUP BY
    hc.name, hc.address, s.name, s.unit_number,
    vendor.full_name, vendor.email, so.operational_status,
    latest_inspection.grade
ORDER BY hc.name, s.unit_number;

SELECT
    r.role_name,
    u.full_name,
    u.email,
    u.account_status,
    CASE
      WHEN u.email IN (
        N'demo.customer01@test.com', N'demo.customer02@test.com',
        N'demo.customer03@test.com', N'demo.customer04@test.com',
        N'vendor01@test.com', N'vendor02@test.com', N'vendor03@test.com',
        N'vendor04@test.com', N'vendor05@test.com',
        N'operator01@test.com', N'operator02@test.com',
        N'ninanea@gmail.com', N'nea02@test.com'
      ) THEN N'Demo seed account'
      ELSE N'Existing account'
    END AS account_note
FROM dbo.users u
JOIN dbo.roles r ON r.role_id = u.role_id
WHERE u.email_normalized IN (
    N'demo.customer01@test.com', N'demo.customer02@test.com',
    N'demo.customer03@test.com', N'demo.customer04@test.com',
    N'vendor01@test.com', N'vendor02@test.com', N'vendor03@test.com',
    N'vendor04@test.com', N'vendor05@test.com',
    N'operator01@test.com', N'operator02@test.com',
    N'ninanea@gmail.com', N'nea02@test.com'
)
ORDER BY r.role_name, u.email;
GO
