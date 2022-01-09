CREATE TABLE COMPANIES(company_name varchar(50) primary key, full_name varchar(50));
CREATE TABLE SUBSCRIBERS(email varchar(50), ticker varchar(50), foreign key(ticker) references COMPANIES(company_name), primary key(email, ticker));

drop table bsoft_87718735;
drop table tatasteel_45439101;
drop table coke;
drop table elgiequip;
drop table etsy;
drop table hdfc;
drop table hindunilvr;
drop table hpq;
drop table icicibank;
drop table radico;
drop table rajeshexpo;
drop table reliance;
drop table sbin;
drop table tatamotors;
delete from companies;