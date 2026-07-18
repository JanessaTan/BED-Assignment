--CREATE DATABASE HawkerCentreManagementSystem;
--GO

USE HawkerCentreManagementSystem; 
GO

/*** Delete tables (if they exist) before creating ***/

DROP TABLE IF EXISTS dbo.OrderItem;
DROP TABLE IF EXISTS dbo.Likes;
DROP TABLE IF EXISTS dbo.MenuItemCuisine;
DROP TABLE IF EXISTS dbo.MenuItem;
DROP TABLE IF EXISTS dbo.RentalAgreement;
DROP TABLE IF EXISTS dbo.Promotion;
DROP TABLE IF EXISTS dbo.InspectionRemark;
DROP TABLE IF EXISTS dbo.Inspection;
DROP TABLE IF EXISTS dbo.Feedback;
DROP TABLE IF EXISTS dbo.CustOrder;
DROP TABLE IF EXISTS dbo.Complaint;
DROP TABLE IF EXISTS dbo.Customer;
DROP TABLE IF EXISTS dbo.StallOwner;
DROP TABLE IF EXISTS dbo.FoodStall;
DROP TABLE IF EXISTS dbo.HawkerCentre;
DROP TABLE IF EXISTS dbo.Cuisine;
DROP TABLE IF EXISTS dbo.NEA_Officer;
DROP TABLE IF EXISTS dbo.Operator;
GO


/**Create Tables **/

CREATE TABLE dbo.Operator
(
    OperatorID VARCHAR(10) NOT NULL,
    OperatorName VARCHAR(50) NOT NULL,
    ContactPerson VARCHAR(50),

    CONSTRAINT PK_Operator 
        PRIMARY KEY (OperatorID)
);
GO

CREATE TABLE dbo.NEA_Officer
(
    OfficerID VARCHAR(10) NOT NULL,
    OfficerName VARCHAR(50) NOT NULL,
    OfficerContactNo VARCHAR(15),

    CONSTRAINT PK_NEA_Officer 
        PRIMARY KEY (OfficerID)
);
GO

CREATE TABLE dbo.HawkerCentre
(
	HawkerCentreID VARCHAR(5) NOT NULL,
    HCName VARCHAR(50),
    HCAddress VARCHAR(100),
    OperatorID VARCHAR(10) NOT NULL,
	CONSTRAINT PK_HawkerCentre PRIMARY KEY (HawkerCentreID),
    CONSTRAINT FK_HawkerCentre_Operator FOREIGN KEY (OperatorID) REFERENCES dbo.Operator(OperatorID)
);

CREATE TABLE dbo.FoodStall
(
	StallID	VARCHAR(4)	NOT NULL,
	StallUnitNo VARCHAR(10),
	StallName VARCHAR(50),
	StallDesc VARCHAR(100),
    HawkerCentreID VARCHAR(5) NOT NULL,
	CONSTRAINT PK_FoodStall PRIMARY KEY (StallID),
	CONSTRAINT FK_FoodStall_HawkerCentre
		FOREIGN KEY (HawkerCentreID) REFERENCES dbo.HawkerCentre(HawkerCentreID)
);


CREATE TABLE dbo.Customer
(
   CustomerID VARCHAR(10)  NOT NULL,
   CustNRIC  VARCHAR(9) NOT NULL,
   CustName VARCHAR (100) NOT NULL,
   CustContactNo VARCHAR(15) ,
   CustEmail VARCHAR(100),
   CONSTRAINT PK_Customer PRIMARY KEY (CustomerID)
);
GO

/*
CREATE TABLE dbo.Complaint
(
   FbkID  VARCHAR(4)   NOT NULL,
   Category  VARCHAR(50),
   CONSTRAINT PK_Complaint PRIMARY KEY (FbkID)
);
GO
*/

CREATE TABLE dbo.Cuisine 
( 
  CuisineID VARCHAR(10) NOT NULL,
  CuisineDesc VARCHAR(20),
  CONSTRAINT PK_Cuisine PRIMARY KEY (CuisineID)
);
GO


CREATE TABLE dbo.CustOrder
(
  OrderID VARCHAR(10) NOT NULL,
  OrderDate DATE NOT NULL,
  PmtType VARCHAR(20) NOT NULL,
  CustomerID VARCHAR(10) ,
  CONSTRAINT PK_CustOrder PRIMARY KEY (OrderID),
  CONSTRAINT FK_Customer_CustomerID FOREIGN KEY (CustomerID) REFERENCES
  dbo.Customer(CustomerID),
);
GO

CREATE TABLE dbo.Feedback
(
	FbkID	VARCHAR(4)	NOT NULL,
    Category VARCHAR(50) NOT NULL CHECK (Category IN ('General', 'Compliment', 'Complaint', 'Suggestion')),
    Subcategory  VARCHAR(50) NOT NULL CHECK (Subcategory IN ('Misc.', 'Hygiene', 'Environment', 'Food Quality', 'Portion Size', 'Price', 'Service', 'Wait Time')),
	FbkComment	VARCHAR(255),
	FbkDateTime	DATETIME NOT NULL,
	FbkRating INT,
	CustomerID	VARCHAR(10) NOT NULL,
	StallID	VARCHAR(4) NOT NULL,
	CONSTRAINT PK_Feedback PRIMARY KEY (FbkID),
	CONSTRAINT FK_Feedback_Customer
		FOREIGN KEY (CustomerID) REFERENCES dbo.Customer(CustomerID),
	CONSTRAINT FK_Feedback_FoodStall
		FOREIGN KEY (StallID) REFERENCES dbo.FoodStall(StallID)
);

CREATE TABLE dbo.Inspection
(
	InspectionID VARCHAR(10) NOT NULL,
    InspectionDate DATE NOT NULL,
    HygieneGrade CHAR(1),
    GradeExpiry DATE,
    OfficerID VARCHAR(10) NOT NULL,
    StallID VARCHAR(4) NOT NULL,
	CONSTRAINT PK_Inspection PRIMARY KEY (InspectionID),
    CONSTRAINT FK_Inspection_Officer FOREIGN KEY (OfficerID) REFERENCES dbo.NEA_Officer(OfficerID),
	CONSTRAINT FK_Inspection_Stall FOREIGN KEY (StallID) REFERENCES dbo.FoodStall(StallID)
);
GO

/*CREATE TABLE dbo.InspectionRemark
(
    InspectionID VARCHAR(10) NOT NULL,
    InspectionRemark VARCHAR(255) NOT NULL,

    CONSTRAINT PK_InspectionRemark 
        PRIMARY KEY (InspectionID),

    CONSTRAINT FK_InspectionRemark_Inspection
        FOREIGN KEY (InspectionID)
        REFERENCES dbo.Inspection (InspectionID)
);
GO*/

CREATE TABLE dbo.Promotion
(
	PromoID varchar(4) NOT NULL,
	PromoDesc varchar(50),
	PromoStartDate smalldatetime,
	PromoEndDate smalldatetime,
	StallID varchar(4) NOT NULL,
	CONSTRAINT PK_Promotion PRIMARY KEY (PromoID),
	CONSTRAINT FK_Promotion FOREIGN KEY (StallID) REFERENCES FoodStall(StallID)
);
GO

CREATE TABLE dbo.StallOwner
(
	OwnerID varchar(5) NOT NULL,
	OwnerName varchar(50),
	OwnerNRIC varchar(9) NOT NULL UNIQUE,
	OwnerContactNo varchar(8) UNIQUE,
	CONSTRAINT PK_StallOwner PRIMARY KEY (OwnerID)
);
GO

CREATE TABLE dbo.RentalAgreement
(
	AgreementID varchar(5) NOT NULL,
	AgrStartDate smalldatetime,
	AgrEndDate smalldatetime,
	AgrTermCondition varchar(200),
	RentalPrice money,
	OwnerID varchar(5) NOT NULL,
	StallID varchar(4) NOT NULL,
	CONSTRAINT PK_RentalAgreement PRIMARY KEY (AgreementID),
	CONSTRAINT FK1_RentalAgreement FOREIGN KEY (OwnerID) REFERENCES StallOwner(OwnerID),
	CONSTRAINT FK2_RentalAgreement FOREIGN KEY (StallID) REFERENCES FoodStall(StallID)
);
GO

CREATE TABLE dbo.MenuItem
(
    StallID varchar(4) NOT NULL,
    ItemCode varchar(10) NOT NULL,
    ItemDesc varchar(100),
    ItemPrice money,
    ItemCategory varchar(50),

    CONSTRAINT PK_MenuItem 
        PRIMARY KEY (StallID, ItemCode),

    CONSTRAINT FK_MenuItem_StallID 
        FOREIGN KEY (StallID) REFERENCES FoodStall(StallID)
);
GO

CREATE TABLE dbo.MenuItemCuisine
(
    CuisineID varchar(10) NOT NULL,
    StallID varchar(4) NOT NULL,
    ItemCode varchar(10) NOT NULL,

    CONSTRAINT PK_MenuItemCuisine 
        PRIMARY KEY (CuisineID, StallID, ItemCode),

    CONSTRAINT FK_MenuItemCuisine_CuisineID 
        FOREIGN KEY (CuisineID) REFERENCES Cuisine(CuisineID),

    CONSTRAINT FK_MenuItemCuisine_MenuItem 
        FOREIGN KEY (StallID, ItemCode) 
        REFERENCES MenuItem(StallID, ItemCode)
);
GO

CREATE TABLE dbo.Likes
(
    CustomerID varchar(10) NOT NULL,
    ItemCode varchar(10) NOT NULL,

    CONSTRAINT PK_Likes 
        PRIMARY KEY (CustomerID, ItemCode),

    CONSTRAINT FK_Likes_CustomerID 
        FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),

    /*CONSTRAINT FK_Likes_MenuItem 
        FOREIGN KEY (StallID, ItemCode) 
        REFERENCES MenuItem(StallID, ItemCode)*/
);
GO

CREATE TABLE dbo.OrderItem
(
    OrderID varchar(10) NOT NULL,
    OrderItemNo int NOT NULL,
    StallID varchar(4) NOT NULL,
    ItemCode varchar(10) NOT NULL,
    Quantity int,
    UnitPrice money,

    CONSTRAINT PK_OrderItem 
        PRIMARY KEY (OrderID, OrderItemNo),

    CONSTRAINT FK_OrderItem_OrderID 
        FOREIGN KEY (OrderID) REFERENCES CustOrder(OrderID),

    CONSTRAINT FK_OrderItem_MenuItem 
        FOREIGN KEY (StallID, ItemCode) 
        REFERENCES MenuItem(StallID, ItemCode)
);
GO


/*Insert rows*/

INSERT INTO Operator VALUES
('OP01', 'Kopitiam Group Pte Ltd', 'Jason Tan'),
('OP02', 'NTUC Foodfare', 'Sarah Lim'),
('OP03', 'Fei Siong Group', 'Daniel Ong'),
('OP04', 'Kimly Group', 'Melissa Goh'),
('OP05', 'Chang Cheng Group', 'Michael Lee'),
('OP06', 'Koufu Pte Ltd', 'Adrian Chua'),
('OP07', 'Food Republic', 'Wendy Koh'),
('OP08', 'Timbre Group', 'Andrew Ho'),
('OP09', 'Broadway Food', 'Esther Ng'),
('OP10', 'Select Group', 'Kelvin Teo');


INSERT INTO NEA_Officer VALUES
('O001', 'Lim Wei Jian', '91234567'),
('O002', 'Aisyah Binte Ahmad', '92345678'),
('O003', 'Rajesh Kumar', '93456789'),
('O004', 'Tan Mei Ling', '94567890'),
('O005', 'Muhammad Hafiz', '95678901'),
('O006', 'Siti Nur Aisyah', '96781234'),
('O007', 'Benjamin Wong', '97892345'),
('O008', 'Nur Hidayah', '98903456'),
('O009', 'Arjun Patel', '90014567'),
('O010', 'Chong Yi Xuan', '91125678');


insert into HawkerCentre values
('HC01', 'Maxwell Food Centre', '1 Kadayanallur St, Singapore 069184', 'OP01'),
('HC02', 'Chinatown Complex', '335 Smith St, Singapore 050335', 'OP02'),
('HC03', 'Old Airport Road FC', '51 Old Airport Rd, Singapore 390051', 'OP03'),
('HC04', 'Tekka Centre', '665 Buffalo Rd, Singapore 210665', 'OP04'),
('HC05', 'Tiong Bahru Market', '30 Seng Poh Rd, Singapore 168898', 'OP05'),
('HC06', 'Amoy Street Food Centre', '7 Maxwell Rd, Singapore 069111', 'OP06');


INSERT INTO FoodStall VALUES
('S001', '#01-01', 'Ah Huat Chicken Rice', 'Famous Hainanese Chicken rice', 'HC01'),
('S002', '#01-02', 'Mak Cik Nasi Lemak', 'Traditional nasi lemak', 'HC01'),
('S003', '#01-03', 'Burger Lab', 'Gourmet burgers', 'HC01'),
('S004', '#01-04', 'Delight Curry Rice', 'Mixed curry rice with sides', 'HC01'),
('S005', '#01-05', 'Noodle Express', 'Quick noodle dishes', 'HC01'),
('S006', '#01-06', 'Popiah Corner', 'Fresh popiah rolls', 'HC01'),
('S007', '#01-07', 'Satay Hut', 'Grilled satay with peanut sauce', 'HC01'),
('S008', '#02-01', 'Raj Briyani', 'Authentic Indian briyani', 'HC02'),
('S009', '#02-02', 'Western Delight', 'Grilled western food', 'HC02'),
('S010', '#02-03', 'Pho Saigon', 'Vietnamese pho', 'HC02'),
('S011', '#02-04', 'Chinatown Dim Sum', 'Cantonese dim sum', 'HC02'),
('S012', '#02-05', 'Prawn Noodle House', 'Traditional prawn noodle soup', 'HC02'),
('S013', '#03-01', 'Tokyo Ramen', 'Japanese ramen and gyoza', 'HC03'),
('S014', '#03-02', 'Warung Kita', 'Malay home-style food', 'HC03'),
('S015', '#03-03', 'Sushi Go', 'Affordable sushi sets', 'HC03'),
('S016', '#03-04', 'Laksa Express', 'Spicy laksa bowls', 'HC03'),
('S017', '#03-05', 'Chicken Rice Deluxe', 'Hainanese chicken rice', 'HC03'),
('S018', '#04-01', 'Veggie Life', 'Healthy vegetarian meals', 'HC04'),
('S019', '#04-02', 'Laksa King', 'Katong-style laksa', 'HC04'),
('S020', '#04-03', 'Mee Siam House', 'Traditional mee siam', 'HC04'),
('S021', '#04-04', 'Roti John Stall', 'Egg and meat stuffed bread', 'HC04'),
('S022', '#04-05', 'Thosai Corner', 'South Indian thosai varieties', 'HC04'),
('S023', '#05-01', 'Claypot Master', 'Claypot rice specialties', 'HC05'),
('S024', '#05-02', 'BBQ Express', 'Roasted meat and BBQ', 'HC05'),
('S025', '#05-03', 'Seafood Paradise', 'Fresh seafood dishes', 'HC05'),
('S026', '#05-04', 'Chicken Curry Corner', 'Spicy chicken curry', 'HC05'),
('S027', '#05-05', 'Fish Soup House', 'Traditional fish soup', 'HC05'),
('S028', '#06-01', 'Amoy Chicken Rice', 'Famous Hainanese chicken rice', 'HC06'),
('S029', '#06-02', 'Amoy Nasi Lemak', 'Traditional nasi lemak', 'HC06'),
('S030', '#06-03', 'Beef Noodle House', 'Savory beef noodle soup', 'HC06'),
('S031', '#06-04', 'Curry Puff Corner', 'Freshly baked curry puffs', 'HC06'),
('S032', '#06-05', 'Claypot Delights', 'Claypot rice specialties', 'HC06');


insert into Customer values ('CU001','S1234567A','Alex Tan','91234567','alex@gmail.com'),
('CU002','S2345678B','Mei Ling','92345678','mei@gmail.com'),
('CU003','S3456789C','Raj Kumar','93456789','raj@gmail.com'),
('CU004','S4567890D','Sarah Lim','94567890','sarah@gmail.com'),
('CU005','S5678901E','Daniel Ong','95678901','daniel@gmail.com'),
('CU006','S6789012F','Aisyah Rahman','96789012','aisyah@gmail.com'),
('CU007','S7890123G','Jason Lee','97890123','jason@gmail.com'),
('CU008','S8901234H','Nur Aini','98901234','nuraini@gmail.com'),
('CU009','S9012345I','Kelvin Goh','91239876','kelvin@gmail.com'),
('CU010','S0123456J','Priya Nair','92348765','priya@gmail.com'),
('CU011','S1122334K','Benjamin Chua','93457654','ben@gmail.com'),
('CU012','S2233445L','Farah Hassan','94566543','farah@gmail.com'),
('CU013','S3344556M','Wei Ming','95675432','weiming@gmail.com'),
('CU014','S4455667N','Siti Aminah','96784321','siti@gmail.com'),
('CU015','S5566778O','Andrew Wong','97893210','andrew@gmail.com'),
('CU016','S6677889P','Muhammad Irfan','98902109','irfan@gmail.com'),
('CU017','S7788990Q','Chloe Tan','91112223','chloe@gmail.com'),
('CU018','S8899001R','Jonathan Teo','92223334','jonathan@gmail.com'),
('CU019','S9900112S','Hafiz Ahmad','93334445','hafiz@gmail.com'),
('CU020','S1011123T','Evelyn Ng','94445556','evelyn@gmail.com'),
('CU021','S1212121A','Lydia Chan','93330001','lydia.chan@example.com'),
('CU022','S2323232B','Gavin Lim','93330002','gavin.lim@example.com'),
('CU023','S3434343C','Aman Deep','93330003','aman.deep@example.com'),
('CU024','S4545454D','Nurul Izzah','93330004','nurul.izzah@example.com'),
('CU025','S5656565E','Derek Ng','93330005','derek.ng@example.com'),
('CU026','S6767676F','Hana Lee','93330006','hana.lee@example.com'),
('CU027','S7878787G','Marcus Tan','93330007','marcus.tan@example.com'),
('CU028','S8989898H','Cheryl Koh','93330008','cheryl.koh@example.com'),
('CU029','S9090909I','Victor Ong','93330009','victor.ong@example.com'),
('CU030','S0101010J','Priyanka Rao','93330010','priyanka.rao@example.com'),
('CU031','S1111111K','Ethan Goh','93330011','ethan.goh@example.com'),
('CU032','S2222222L','Farid Hamzah','93330012','farid.hamzah@example.com'),
('CU033','S3333333M','Wei Xuan','93330013','wei.xuan@example.com'),
('CU034','S4444444N','Nur Sabrina','93330014','nur.sabrina@example.com'),
('CU035','S5555555O','Andrew Chia','93330015','andrew.chia@example.com'),
('CU036','S6666666P','Irfan Shah','93330016','irfan.shah@example.com'),
('CU037','S7777777Q','Chloe Lim','93330017','chloe.lim2@example.com'),
('CU038','S8888888R','Jonathan Ho','93330018','jon.ho@example.com'),
('CU039','S9999999S','Hafiz Rosli','93330019','hafiz.rosli@example.com'),
('CU040','T0102030T','Evelyn Toh','93330020','evelyn.toh@example.com');

/*
insert into Complaint values ('F001' , 'Hygiene'),
('F002','Service'),
('F003','Food Quality'),
('F004','Cleanliness'),
('F005','Atmosphere'),
('F006','Long Queue'),
('F007','Overpriced'),
('F008','Undercooked Food'),
('F009','Noisy Environment'),
('F010','Wrong Order');
*/

insert into Cuisine values 
('C01','Chinese'),
('C02','Malay'),
('C03','Indian'),
('C04','Indonesia'),
('C05','Japanese'),
('C06','Western');


-- Insert 50 orders into CustOrder (OrderID, OrderDate, PmtType, CustomerID)
INSERT INTO CustOrder (OrderID, OrderDate, PmtType, CustomerID) VALUES
-- 2025-01-01
('O001','2025-01-01','Cash','CU019'),
('O002','2025-01-01','PayNow','CU002'),

-- 2025-01-02
('O003','2025-01-02','Credit Card','CU017'),
('O004','2025-01-02','NETS','CU004'),

-- 2025-01-03
('O005','2025-01-03','Cash','CU015'),
('O006','2025-01-03','PayNow','CU006'),

-- 2025-01-04
('O007','2025-01-04','Credit Card','CU013'),
('O008','2025-01-04','NETS','CU008'),

-- 2025-01-05
('O009','2025-01-05','Cash','CU011'),
('O010','2025-01-05','PayNow','CU010'),

-- 2025-01-06
('O011','2025-01-06','Credit Card','CU009'),
('O012','2025-01-06','NETS','CU012'),

-- 2025-01-07
('O013','2025-01-07','Cash','CU007'),
('O014','2025-01-07','PayNow','CU014'),

-- 2025-01-08
('O015','2025-01-08','Credit Card','CU006'),
('O016','2025-01-08','NETS','CU016'),

-- 2025-01-09
('O017','2025-01-09','Cash','CU017'),
('O018','2025-01-09','PayNow','CU018'),

-- 2025-01-10
('O019','2025-01-10','Credit Card','CU019'),
('O020','2025-01-10','NETS','CU020'),

-- 2025-01-11
('O021','2025-01-11','Cash','CU021'),
('O022','2025-01-11','PayNow','CU022'),

-- 2025-01-12
('O023','2025-01-12','Credit Card','CU023'),
('O024','2025-01-12','NETS','CU024'),

-- 2025-01-13
('O025','2025-01-13','Cash','CU025'),
('O026','2025-01-13','PayNow','CU026'),

-- 2025-01-14
('O027','2025-01-14','Credit Card','CU027'),
('O028','2025-01-14','NETS','CU028'),

-- 2025-01-15
('O029','2025-01-15','Cash','CU029'),
('O030','2025-01-15','PayNow','CU030'),

-- 2025-01-16
('O031','2025-01-16','Credit Card','CU031'),
('O032','2025-01-16','NETS','CU032'),

-- 2025-01-17
('O033','2025-01-17','Cash','CU033'),
('O034','2025-01-17','PayNow','CU034'),

-- 2025-01-18
('O035','2025-01-18','Credit Card','CU035'),
('O036','2025-01-18','NETS','CU036'),

-- 2025-01-19
('O037','2025-01-19','Cash','CU037'),
('O038','2025-01-19','PayNow','CU038'),

-- 2025-01-20
('O039','2025-01-20','Credit Card','CU039'),
('O040','2025-01-20','NETS','CU040'),

-- 2025-01-21 (wrap to CU001..CU010)
('O041','2025-01-21','Cash','CU001'),
('O042','2025-01-21','PayNow','CU002'),

-- 2025-01-22
('O043','2025-01-22','Credit Card','CU003'),
('O044','2025-01-22','NETS','CU004'),

-- 2025-01-23
('O045','2025-01-23','Cash','CU005'),
('O046','2025-01-23','PayNow','CU006'),

-- 2025-01-24
('O047','2025-01-24','Credit Card','CU007'),
('O048','2025-01-24','NETS','CU008'),

-- 2025-01-25
('O049','2025-01-25','Cash','CU009'),
('O050','2025-01-25','PayNow','CU010');


insert into FeedBack values
('F001', 'Compliment', 'Food Quality', 'Food was delicious!', '2025-01-05 12:30', 5, 'CU001', 'S001'),
('F002', 'Complaint', 'Service', 'Poor service and rude staff.', '2025-01-06 13:10', 1, 'CU002', 'S002'),
('F003', 'Compliment', 'Portion Size', 'Portion size is generous', '2025-01-07 18:45', 4, 'CU003', 'S003'),
('F004', 'Compliment', 'Hygiene', 'Stall was very clean', '2025-01-08 11:20', 5, 'CU004', 'S004'),
('F005', 'Complaint', 'Price', 'Price slightly high', '2025-01-09 19:00', 3, 'CU005', 'S005'),
('F006', 'Compliment', 'Service', 'Friendly staff', '2025-01-10 14:15', 4, 'CU006', 'S006'),
('F007', 'Complaint', 'Misc.', 'Annoying pest birds around stall', '2025-01-12 18:30', 2, 'CU008', 'S008'),
('F008', 'Compliment', 'Environment', 'Pleasant atmosphere.', '2025-01-14 13:55', 5, 'CU010', 'S010'),
('F009', 'General', 'Food Quality', 'Burger was juicy but bun was soggy.', '2025-01-16 13:05', 4, 'CU022', 'S003'),
('F010', 'Compliment', 'Wait Time', 'Food was served quickly', '2025-01-17 18:10', 5, 'CU023', 'S002'),
('F011', 'Complaint', 'Environment', 'Environment was very noisy', '2025-01-18 11:35', 2, 'CU024', 'S008'),
('F012', 'Compliment', 'Price', 'Drinks are value for money.', '2025-01-19 09:10', 4, 'CU025', 'S010'),
('F013', 'General', 'Wait Time', 'Queue can move slowly at lunch, but is fast at non-peak hours.', '2025-01-20 12:55', 3, 'CU026', 'S007'),
('F014', 'Complaint', 'Hygiene', 'Food stains and bird poop on tables', '2025-01-21 15:40', 1, 'CU027', 'S009'),
('F015', 'Suggestion', 'Misc.', 'Bring back takoyaki as a side option!', '2025-01-22 19:20', 3, 'CU028', 'S013');


insert into Inspection values
('IN001', '2024-12-01', 'A', '2025-12-01', 'O001', 'S001'),
('IN002', '2024-12-05', 'B', '2025-06-05', 'O002', 'S002'),
('IN003', '2024-12-10', 'A', '2025-12-10', 'O003', 'S003'),
('IN004', '2024-12-15', 'C', '2025-03-15', 'O004', 'S004'),
('IN005', '2024-12-20', 'A', '2025-12-20', 'O005', 'S005'),
('IN006', '2025-01-02', 'B', '2025-07-02', 'O001', 'S006'),
('IN007', '2025-01-05', 'A', '2026-01-05', 'O002', 'S007'),
('IN008', '2025-01-07', 'B', '2025-07-07', 'O003', 'S008'),
('IN009', '2025-01-10', 'A', '2026-01-10', 'O004', 'S009'),
('IN010', '2025-01-12', 'C', '2025-04-12', 'O005', 'S010'),
('IN011','2025-01-14','B','2025-07-14','O006','S011'),
('IN012','2025-01-16','A','2026-01-16','O007','S012'),
('IN013','2025-01-18','C','2025-04-18','O008','S013'),
('IN014','2025-01-20','D','2025-03-20','O009','S014')
/*('IN015','2025-01-22','B','2025-07-22','O010','S015'),
('IN016','2025-01-24','A','2026-01-24','O001','S016'),
('IN017','2025-01-26','C','2025-04-26','O002','S017'),
('IN018','2025-01-28','B','2025-07-28','O003','S018'),
('IN019','2025-01-30','A','2026-01-30','O004','S019'),
('IN020','2025-02-01','D','2025-05-01','O005','S020'),
('IN021','2025-02-03','A','2026-02-03','O006','S021'),
('IN022','2025-02-05','B','2025-08-05','O007','S022'),
('IN023','2025-02-07','C','2025-05-07','O008','S023'),
('IN024','2025-02-09','D','2025-05-09','O009','S024'),
('IN025','2025-02-11','A','2026-02-11','O010','S025'),
('IN026','2025-02-13','B','2025-08-13','O001','S026'),
('IN027','2025-02-15','C','2025-05-15','O002','S027'),
('IN028','2025-02-17','A','2026-02-17','O003','S028'),
('IN029','2025-02-19','B','2025-08-19','O004','S029'),
('IN030','2025-02-21','D','2025-05-21','O005','S030'),
('IN031','2025-02-23','A','2026-02-23','O006','S031'),
('IN032','2025-02-25','B','2025-08-25','O007','S032');*/


/*insert into InspectionRemark values
('IN001', 'Excellent hygiene practices observed.'),
('IN002', 'Minor Hygiene issues found near sink area.'),
('IN003', 'Food handling procedures followed correctly.'),
('IN004', 'Poor waste disposal management detected.'),
('IN005', 'Stall maintained very high cleanliness standards.'),
('IN006', 'Handwashing area requires better maintenance.'),
('IN007', 'All hygiene requirements fully met.'),
('IN008', 'Storage area needs better organisation.'),
('IN009', 'Clean and well-maintained cooking equipment.'),
('IN010', 'Pest control measures need improvement.'),
('IN012','Exemplary food storage and temperature logs maintained.'),
('IN013','Cluttered preparation area; recommend 5S organization.'),
('IN014','Multiple critical issues: pest sighting and dirty bins.'),
('IN015','Handwash basins available but insufficient soap refills.'),
('IN016','All hygiene SOPs followed; equipment well-maintained.'),
('IN017','Expired condiments found; removed and briefed owner.'),
('IN018','Waste disposal schedule improved since last check.'),
('IN019','Excellent record-keeping and sanitization routines.'),
('IN020','Deep-cleaning plan requested; follow-up in one month.'),
('IN021','Overall cleanliness acceptable; some dust on shelves.'),
('IN022','Cutting boards need replacement due to wear.'),
('IN023','Good pest prevention measures observed.'),
('IN024','Unsanitary floor drains; cleaning required.'),
('IN025','Proper food rotation (FIFO) consistently practiced.'),
('IN026','Improper chemical storage found; corrected on-site.'),
('IN027','Stall generally clean but ventilation hood oily.'),
('IN028','Excellent personal hygiene by all staff.'),
('IN029','Temperature logs incomplete for the week.'),
('IN030','Thorough cleaning observed; no major issues.'),
('IN031','Handwashing compliance improved since last visit.'),
('IN032','Stale ingredients found; advised immediate disposal.');

SELECT * FROM InspectionRemark;*/

insert into Promotion values 
('P001','10% off main dishes','2025-06-20','2025-07-20','S003'),
('P002','free drink for set meal order','2025-09-01','2025-10-05','S006'),
('P003','$2 off set meals','2025-06-10','2025-07-10','S003'),
('P004','$2 off side dishes on Tuesdays','2026-01-01','2027-01-01','S002'),
('P005','free side dish for saver meal order','2026-01-03','2026-02-18','S007'),
('P006','15% discount on weekends','2025-08-01','2025-08-31','S001'),
('P007','Free dessert with any meal','2025-10-01','2025-11-01','S002'),
('P008','Buy 1 get 1 free drinks','2025-07-15','2025-08-15','S004'),
('P009','$3 off seafood dishes','2026-02-01','2026-03-01','S005'),
('P010','10% student discount','2026-05-01','2026-06-30','S006'),
('P011','Lunch combo $1 off','2026-02-15','2026-03-31','S011'),
('P012','Free drink with burger set','2026-02-10','2026-03-10','S003'),
('P013','20% off dim sum before 11am','2026-02-05','2026-02-28','S008');


insert into StallOwner values 
('SO001','Chan Kim Kim','S7544393E','85742241'),
('SO002','Tan Mei Ling','S8522441G','93583104'),
('SO003','Jeremy Law','T0627772H','97974131'),
('SO004','Lim Ah Gek','S2281542C','87177576'),
('SO005','Siti Suhaila','S6518592Z','89642206'),
('SO006','Kumar Agni','S9593960J','80796440'),
('SO007','Steven Fine','S0843121C','89435241'),
('SO008','Howard Huang','S2810866D','96682382'),
('SO009','Seck Choon','S5680072G','92638639'),
('SO010','Rachel Peng','T4118570D','98565107'),
('SO011','Surya Mohammad','S4967891F','89617111'),
('SO012','Goh Soon Ong','S4102889J','94682168'),
('SO013','Aidan Leong','S6460428G','91094244'),
('SO014','Chang Rong Hou','S1064434H','80224476'),
('SO015','Osman Saad','T6856168F','89615578'),
('SO016','Brandon Chia','S7329144E','91234578'),
('SO017','Nur Afiqah','T2045193F','88421367'),
('SO018','Leonard Goh','S5612993H','93667821'),
('SO019','Farid Hassan','S8044662D','97881234'),
('SO020','Cheryl Tan','T0195622J','90336712'),
('SO021','Wei Ming Ong','S6599144K','82445519'),
('SO022','Priscilla Yeo','S9133221F','91568823'),
('SO023','Marcus Lee','T1138249H','88994531'),
('SO024','Rina Devi','S7366118G','87663219'),
('SO025','Kelvin Soh','S5074226A','96441182');


insert into RentalAgreement values 
('RA001','2025-01-01','2025-12-31','One year lease, rental payable monthly, no subletting allowed.',2200.00,'SO001','S001'),
('RA002','2023-03-01','2024-02-29','One year agreement, utilities charged separately.',2400.00,'SO002','S002'),
('RA003','2023-06-01','2025-05-31','Two year lease, rental reviewed annually.',2600.00,'SO003','S003'),
('RA004','2023-09-01','2024-08-31','Short term lease, renewable upon approval.',2100.00,'SO004','S004'),
('RA005','2024-01-01','2024-12-31','One year contract, payment made quarterly.',2300.00,'SO005','S005'),
('RA006','2024-02-15','2025-02-14','One year lease, no transfer of ownership.',2500.00,'SO001','S006'),
('RA007','2024-04-01','2026-03-31','Two year agreement, maintenance by stall owner.',2800.00,'SO007','S007'),
('RA008','2024-06-01','2025-05-31','One year lease, stall must operate daily.',2400.00,'SO008','S008'),
('RA009','2024-08-01','2026-07-31','Two year contract, utilities excluded from rental.',3000.00,'SO009','S009'),
('RA010','2024-10-01','2025-09-30','One year lease, subject to renewal.',2350.00,'SO010','S010'),
('RA011','2025-01-01','2026-12-31','Two year lease, rental fixed for entire period.',2700.00,'SO011','S011'),
('RA012','2025-03-01','2026-02-28','One year agreement, no subletting or sharing.',2450.00,'SO012','S012'),
('RA013','2025-05-01','2027-04-30','Two year lease, rental payable monthly in advance.',2900.00,'SO013','S013'),
('RA014','2025-07-01','2026-06-30','One year lease, stall cleanliness inspections required.',2250.00,'SO014','S014'),
('RA015','2025-09-01','2027-08-31','Two year contract, renewal subject to management approval.',3100.00,'SO015','S015'),
('RA016','2025-11-01','2026-10-31','One year lease, hygiene checks monthly.',2550.00,'SO018','S018'),
('RA017','2025-12-01','2026-11-30','Renewable upon good performance.',2750.00,'SO019','S019'),
('RA018','2026-01-01','2027-12-31','Two year lease, utilities excluded.',2950.00,'SO020','S020'),
('RA019','2026-02-01','2027-01-31','One year lease, quarterly reviews.',2400.00,'SO021','S021'),
('RA020','2026-02-01','2026-12-31','11-month lease, maintain A/B hygiene.',2650.00,'SO022','S022'),
('RA021','2026-03-01','2027-02-28','One year lease, utilities charged separately.',2420.00,'SO016','S016'),
('RA022','2026-03-01','2028-02-29','Two year lease, quarterly inspections required.',2880.00,'SO017','S017'),
('RA023','2026-04-01','2027-03-31','One year lease, grease trap maintenance monthly.',2520.00,'SO018','S018'),
('RA024','2026-04-01','2028-03-31','Two year lease, rental reviewed annually.',3000.00,'SO019','S019'),
('RA025','2026-05-01','2027-04-30','One year lease, no subletting or sharing.',2460.00,'SO020','S020'),
('RA026','2026-05-01','2028-04-30','Two year agreement, pest control by owner.',2920.00,'SO021','S021'),
('RA027','2026-06-01','2027-05-31','One year lease, stall open minimum 6 days/week.',2380.00,'SO022','S022'),
('RA028','2026-06-01','2028-05-31','Two year lease, equipment upkeep by tenant.',2850.00,'SO023','S023'),
('RA029','2026-07-01','2027-06-30','One year lease, hygiene grade A/B maintained.',2550.00,'SO024','S024'),
('RA030','2026-07-01','2028-06-30','Two year contract, utilities excluded.',3050.00,'SO025','S025'),
('RA031','2026-08-01','2027-07-31','One year lease, proper waste disposal required.',2440.00,'SO002','S026'),
('RA032','2026-08-01','2028-07-31','Two year lease, monthly sanitation checks.',2960.00,'SO002','S027'),
('RA033','2026-09-01','2027-08-31','One year lease, FIFO and temp logs mandatory.',2480.00,'SO003','S028'),
('RA034','2026-09-01','2028-08-31','Two year agreement, renewal upon good record.',2980.00,'SO004','S029'),
('RA035','2026-10-01','2027-09-30','One year lease, hood & ducts cleaned quarterly.',2500.00,'SO005','S030'),
('RA036','2026-10-01','2028-09-30','Two year lease, rental fixed first year.',3020.00,'SO006','S031'),
('RA037','2026-11-01','2027-10-31','One year lease, no change of concept without approval.',2410.00,'SO007','S032');


insert into MenuItem values
('S001','I001','Chicken Rice',4.50,'Main'),
('S002','I002','Roasted Duck Rice',5.00,'Main'),
('S003','I003','Nasi Lemak',4.00,'Main'),
('S004','I004','Roti Prata',1.20,'Side'),
('S005','I005','Fish Soup',5.50,'Main'),
('S006','I006','Char Kway Teow',4.80,'Main'),
('S007','I007','Laksa',5.50,'Main'),
('S008','I008','Hokkien Mee',5.00,'Main'),
('S009','I009','Ice Kacang',2.50,'Dessert'),
('S010','I010','Sugarcane Juice',2.00,'Drink'),
('S001','I011','Poached Chicken Rice',5.20,'Main'),
('S001','I012','Chicken Rice (Set)',6.80,'Set'),
('S002','I013','Nasi Lemak Deluxe',5.50,'Main'),
('S002','I014','Ikan Bilis Set',4.80,'Set'),
('S003','I015','Classic Burger',6.50,'Main'),
('S003','I016','Cheese Burger',7.00,'Main'),
('S004','I017','Curry Pork Chop Rice',6.20,'Main'),
('S004','I018','Braised Tofu',3.20,'Side'),
('S005','I019','Ban Mian',4.80,'Main'),
('S005','I020','Tom Yum Noodles',5.80,'Main'),
('S006','I021','Popiah (2 rolls)',3.80,'Side'),
('S006','I022','Signature Popiah',4.50,'Side'),
('S007','I023','Chicken Satay (10pcs)',7.50,'Main'),
('S007','I024','Beef Satay (10pcs)',8.00,'Main'),
('S008','I025','Siew Mai (4pcs)',3.50,'Side'),
('S008','I026','Har Gow (4pcs)',3.80,'Side'),
('S009','I027','Ice Kachang (Large)',3.00,'Dessert'),
('S009','I028','Chendol',2.80,'Dessert'),
('S010','I029','Teh Tarik (Hot)',1.50,'Drink'),
('S010','I030','Iced Lemon Tea',1.80,'Drink'),
('S011','I031','Chicken Chop',7.50,'Main'),
('S011','I032','Fish & Chips',7.80,'Main'),
('S012','I033','Mutton Briyani',7.50,'Main'),
('S012','I034','Chicken Briyani',6.80,'Main'),
('S013','I038','Vegetarian Bee Hoon',3.50,'Main'),
('S013','I039','Fried Spring Roll (2 pcs)',2.00,'Side'),
('S013','I040','Fried Noodles',3.80,'Main'),
('S014','I041','Fried Hokkien Prawn Mee',5.50,'Main'),
('S014','I042','Oyster Omelette',6.00,'Main'),
('S014','I043','Fried Carrot Cake (White)',4.50,'Main'),
('S015','I044','Kway Chap Set',5.50,'Set'),
('S015','I045','Braised Pork Belly Rice',6.00,'Main'),
('S015','I046','Large Kway Chap Set',6.80,'Set'),
('S016','I047','Chicken Curry Rice',4.80,'Main'),
('S016','I048','Fried Fish Fillet Rice',5.20,'Main'),
('S016','I049','Vegetable Curry',2.50,'Side'),
('S017','I050','Thai Basil Chicken Rice',5.80,'Main'),
('S017','I051','Tom Yum Fried Rice',5.50,'Main'),
('S017','I052','Mango Salad',3.50,'Side'),
('S018','I053','Korean Spicy Chicken Set',7.50,'Set'),
('S018','I054','Kimchi Fried Rice',6.00,'Main'),
('S018','I055','Tteokbokki',4.50,'Side'),
('S019','I056','Japanese Chicken Katsu Don',7.20,'Main'),
('S019','I057','Salmon Teriyaki Rice',8.00,'Main'),
('S019','I058','Miso Soup',2.50,'Side'),
('S020','I059','Western Breakfast Set',6.00,'Set'),
('S020','I060','Scrambled Eggs Toast Set',4.20,'Set'),
('S020','I061','Black Coffee',1.40,'Drink'),
('S021','I062','BBQ Chicken Pizza Slice',4.50,'Main'),
('S021','I063','Pepperoni Pizza Slice',4.80,'Main'),
('S021','I064','Garlic Bread (2 pcs)',2.00,'Side'),
('S022','I065','Mini Waffles',2.50,'Dessert'),
('S022','I066','Belgian Waffle (Plain)',3.20,'Dessert'),
('S022','I067','Chocolate Waffle',3.80,'Dessert'),
('S023','I068','Claypot Chicken Rice',5.80,'Main'),
('S023','I069','Claypot Seafood Rice',6.80,'Main'),
('S023','I070','Steamed Vegetables',2.00,'Side'),
('S024','I071','Yong Tau Foo (6 pcs)',5.00,'Main'),
('S024','I072','Yong Tau Foo (8 pcs)',6.20,'Main'),
('S024','I073','Stuffed Tau Pok',1.50,'Side'),
('S025','I074','Duck Noodle',5.00,'Main'),
('S025','I075','Braised Duck Rice',5.50,'Main'),
('S025','I076','Duck Soup',2.50,'Side'),
('S026','I077','Grilled Chicken Sandwich',4.80,'Main'),
('S026','I078','Egg Mayo Sandwich',3.20,'Side'),
('S026','I079','Tuna Sandwich',4.00,'Main'),
('S027','I080','Mee Rebus',4.00,'Main'),
('S027','I081','Mee Soto',4.20,'Main'),
('S027','I082','Begedil',1.00,'Side'),
('S028','I083','Beef Noodles Soup',6.00,'Main'),
('S028','I084','Dry Beef Noodles',6.20,'Main'),
('S028','I085','Pickled Vegetables',1.20,'Side'),
('S029','I086','Thai Green Curry',6.00,'Main'),
('S029','I087','Pad Thai',5.80,'Main'),
('S029','I088','Thai Milk Tea',2.50,'Drink'),
('S030','I089','Mixed Economy Rice (2 Veg 1 Meat)',4.20,'Set'),
('S030','I090','Sweet & Sour Pork',3.00,'Side'),
('S030','I091','Fried Egg',1.00,'Side'),
('S031','I092','Handmade Noodles (Soup)',4.50,'Main'),
('S031','I093','Dry Handmade Noodles',4.50,'Main'),
('S031','I094','Meatballs (4 pcs)',2.00,'Side'),
('S032','I095','Ayam Penyet',6.50,'Main'),
('S032','I096','Soto Ayam',4.50,'Main'),
('S032','I097','Sambal Chilli',0.50,'Side');


INSERT INTO MenuItemCuisine values
('C01','S001','I001'),
('C01','S002','I002'),  
('C02','S003','I003'),  
('C03','S004','I004'),   
('C01','S005','I005'),   
('C01','S006','I006'),   
('C02','S007','I007'),   
('C01','S008','I008'),   
('C04','S009','I009'),  
('C05','S010','I010'),  
('C01','S001','I011'),
('C01','S001','I012'),
('C02','S002','I013'),
('C02','S002','I014'),
('C06','S003','I015'),
('C06','S003','I016'),
('C01','S004','I017'),
('C01','S004','I018'),
('C01','S005','I019'),
('C01','S005','I020'),
('C02','S006','I021'),
('C02','S006','I022'),
('C02','S007','I023'),
('C02','S007','I024'),
('C01','S008','I025'),
('C01','S008','I026'),
('C04','S009','I027'),
('C04','S009','I028'),
('C01','S010','I029'),
('C01','S010','I030'),
('C06','S011','I031'),
('C06','S011','I032'),
('C03','S012','I033'),
('C03','S012','I034'),
('C01','S013','I038'),
('C01','S013','I039'),
('C01','S013','I040'),
('C01','S014','I041'),
('C01','S014','I042'),
('C01','S014','I043'),
('C01','S015','I044'),
('C01','S015','I045'),
('C01','S015','I046'),
('C01','S016','I047'),
('C01','S016','I048'),
('C01','S016','I049'),
('C01','S017','I050'),
('C01','S017','I051'),
('C01','S017','I052'),
('C01','S018','I053'),
('C01','S018','I054'),
('C01','S018','I055'),
('C01','S019','I056'),
('C01','S019','I057'),
('C01','S019','I058'),
('C06','S020','I059'),
('C06','S020','I060'),
('C05','S020','I061'),
('C06','S021','I062'),
('C06','S021','I063'),
('C06','S021','I064'),
('C04','S022','I065'),
('C04','S022','I066'),
('C04','S022','I067'),
('C01','S023','I068'),
('C01','S023','I069'),
('C01','S023','I070'),
('C01','S024','I071'),
('C01','S024','I072'),
('C01','S024','I073'),
('C01','S025','I074'),
('C01','S025','I075'),
('C01','S025','I076'),
('C06','S026','I077'),
('C06','S026','I078'),
('C06','S026','I079'),
('C02','S027','I080'),
('C02','S027','I081'),
('C02','S027','I082'),
('C01','S028','I083'),
('C01','S028','I084'),
('C01','S028','I085'),
('C01','S029','I086'),
('C01','S029','I087'),
('C05','S029','I088'),
('C01','S030','I089'),
('C01','S030','I090'),
('C01','S030','I091'),
('C01','S031','I092'),
('C01','S031','I093'),
('C01','S031','I094'),
('C02','S032','I095'),
('C02','S032','I096'),
('C02','S032','I097');


insert into Likes values
/*('CU001','S001','I001'),
('CU002','S002','I002'),  
('CU003','S003','I003'), 
('CU004','S004','I004'), 
('CU005','S005','I005'),  
('CU006','S006','I006'),  
('CU007','S007','I007'),  
('CU008','S008','I008'),  
('CU009','S009','I009'),*/
('CU002','I010'),  
('CU010','I011'),
('CU023','I012');


insert into OrderItem values
('O001',1,'S001','I001',100,4.50),
('O002',1,'S002','I002',89,5.00),    
('O003',1,'S003','I003',200,4.00),    
('O004',1,'S004','I004',365,1.20),   
('O005',1,'S005','I005',290,5.50),   
('O006',1,'S006','I006',79,4.80),    
('O007',1,'S007','I007',199,5.50),    
('O008',1,'S008','I008',168,5.00),    
('O009',1,'S009','I009',224,2.50),    
('O010',1,'S010','I010',109,2.00),    
('O011',1,'S001','I011',120,5.20),
('O012',1,'S001','I012',95,6.80),
('O013',1,'S002','I013',160,5.50),
('O014',1,'S003','I015',210,6.50),
('O015',1,'S004','I017',175,6.20),
('O016',1,'S006','I021',140,3.80),
('O017',1,'S007','I023',130,7.50),
('O018',1,'S008','I025',180,3.50),
('O019',1,'S009','I027',190,3.00),
('O020',1,'S010','I029',155,1.50),
('O013',2,'S002','I014',80,4.80),
('O014',2,'S003','I016',150,7.00),
('O015',2,'S004','I018',90,3.20),
('O016',2,'S005','I019',110,4.80),
('O017',2,'S007','I024',85,8.00),
('O021',1,'S011','I032',145,2.20),    
('O021',2,'S010','I010',60,2.00),
('O022',1,'S005','I005',210,5.50),   
('O022',2,'S012','I033',95,4.70),     
('O023',1,'S014','I041',180,6.20),    
('O023',2,'S003','I003',75,4.00),     
('O024',1,'S015','I044',160,3.30),    
('O024',2,'S004','I004',120,1.20),    
('O024',3,'S003','I015',40,6.50),     
('O025',1,'S016','I048',135,7.80),    
('O025',2,'S004','I018',85,3.20),     
('O026',1,'S017','I052',190,5.10),    
('O026',2,'S006','I021',70,3.80),     
('O027',1,'S018','I055',175,2.90),    
('O027',2,'S007','I007',66,5.50),     
('O028',1,'S020','I059',150,6.40),    
('O028',2,'S007','I023',95,7.50),     
('O029',1,'S020','I061',205,4.60),    
('O029',2,'S008','I025',110,3.50),   
('O030',1,'S021','I064',168,5.90),    
('O030',2,'S009','I027',100,3.00),    
('O031',1,'S023','I068',155,2.40),    
('O031',2,'S010','I029',120,1.50),   
('O032',1,'S024','I072',140,8.20),   
('O032',2,'S001','I011',90,5.20),     
('O033',1,'S025','I075',199,4.10),    
('O033',2,'S001','I012',84,6.80),     
('O034',1,'S026','I079',170,5.70),    
('O034',2,'S002','I013',100,5.50),    
('O035',1,'S027','I082',220,2.10),    
('O035',2,'S002','I014',88,4.80),     
('O036',1,'S028','I085',160,7.10),   
('O036',2,'S003','I016',120,7.00),   
('O037',1,'S030','I089',145,3.60),   
('O037',2,'S004','I017',95,6.20),     
('O038',1,'S031','I093',180,4.30),    
('O038',2,'S005','I019',105,4.80),    
('O039',1,'S032','I097',175,5.40),    
('O039',2,'S006','I021',115,3.80),    
('O040',1,'S029','I086',190,6.90),    
('O040',2,'S007','I023',100,7.50),   
('O040',3,'S007','I024',75,8.00),     
('O041',1,'S003','I003',130,4.00),    
('O041',2,'S012','I033',70,4.70),    
('O042',1,'S004','I004',240,1.20),    
('O042',2,'S025','I075',90,4.10),     
('O043',1,'S005','I005',200,5.50),    
('O043',2,'S023','I068',95,2.40);     


SELECT * FROM Operator;
SELECT * FROM NEA_Officer;
SELECT * FROM HawkerCentre;
SELECT * FROM FoodStall;
SELECT * FROM Customer;
SELECT * FROM Cuisine;
SELECT * FROM CustOrder;
SELECT * FROM FeedBack;
SELECT * FROM Inspection;
SELECT * FROM Promotion;
SELECT * FROM StallOwner;
SELECT * FROM RentalAgreement;
SELECT * FROM MenuItem;
SELECT * FROM MenuItemCuisine;
SELECT * FROM Likes;
SELECT * FROM OrderItem