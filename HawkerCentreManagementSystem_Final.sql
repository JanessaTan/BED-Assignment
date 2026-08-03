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

DECLARE @AppLoginPassword NVARCHAR(128) = N'HawkerCenter@123';

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
            CONSTRAINT UQ_Customer_LinkedUserID UNIQUE (LinkedUserID)
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
            CONSTRAINT UQ_StallOwner_LinkedUserID UNIQUE (LinkedUserID)
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
            CONSTRAINT UQ_NEA_Officer_LinkedUserID UNIQUE (LinkedUserID)
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
            CreatedAt    DATETIME2(0) NOT NULL
                CONSTRAINT DF_Likes_CreatedAt DEFAULT SYSUTCDATETIME(),
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
    USING (VALUES ('C001', N'Local Test Customer', N'customer.test@example.invalid'))
      AS source(CustomerID, CustName, Email)
      ON target.CustomerID = source.CustomerID
    WHEN NOT MATCHED THEN
      INSERT (CustomerID, CustName, Email)
      VALUES (source.CustomerID, source.CustName, source.Email);

    MERGE dbo.StallOwner AS target
    USING (VALUES ('SO001', N'Local Test Stall Owner', N'vendor.test@example.invalid'))
      AS source(OwnerID, OwnerName, Email)
      ON target.OwnerID = source.OwnerID
    WHEN NOT MATCHED THEN
      INSERT (OwnerID, OwnerName, Email)
      VALUES (source.OwnerID, source.OwnerName, source.Email);

    MERGE dbo.NEA_Officer AS target
    USING (VALUES ('N001', N'Local Test NEA Officer', N'officer.test@example.invalid'))
      AS source(OfficerID, OfficerName, Email)
      ON target.OfficerID = source.OfficerID
    WHEN NOT MATCHED THEN
      INSERT (OfficerID, OfficerName, Email)
      VALUES (source.OfficerID, source.OfficerName, source.Email);

    MERGE dbo.FoodStall AS target
    USING (VALUES ('S001', N'Legacy Sample Food Stall', 'SO001'))
      AS source(StallID, StallName, OwnerID)
      ON target.StallID = source.StallID
    WHEN NOT MATCHED THEN
      INSERT (StallID, StallName, OwnerID)
      VALUES (source.StallID, source.StallName, source.OwnerID);

    MERGE dbo.MenuItem AS target
    USING (VALUES ('S001', 'I001', N'Legacy Sample Meal', CAST(6.00 AS DECIMAL(10,2))))
      AS source(StallID, ItemCode, ItemDesc, ItemPrice)
      ON target.StallID = source.StallID AND target.ItemCode = source.ItemCode
    WHEN NOT MATCHED THEN
      INSERT (StallID, ItemCode, ItemDesc, ItemPrice)
      VALUES (source.StallID, source.ItemCode, source.ItemDesc, source.ItemPrice);

    MERGE dbo.Inspection AS target
    USING (VALUES ('IN001', CAST('2026-07-15' AS DATE), CAST('2027-07-14' AS DATE),
                   'A', 'N001', 'S001'))
      AS source(InspectionID, InspectionDate, GradeExpiry, HygieneGrade, OfficerID, StallID)
      ON target.InspectionID = source.InspectionID
    WHEN NOT MATCHED THEN
      INSERT (InspectionID, InspectionDate, GradeExpiry, HygieneGrade, OfficerID, StallID)
      VALUES (source.InspectionID, source.InspectionDate, source.GradeExpiry,
              source.HygieneGrade, source.OfficerID, source.StallID);

    MERGE dbo.InspectionRemark AS target
    USING (VALUES ('IN001', N'Legacy hygiene smoke-test record.'))
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
