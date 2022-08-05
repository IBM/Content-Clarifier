### Project Control and Description
**Project Name**:   Content Clarifier

**Project Lead**:   Will Scott, scottw1@us.ibm.com

**Organization**:   IBM Accessibility Research

**Classification**:   IBM Confidential - IBM original code

**Description**:    The Content Clarifier is a Cognitive Computing effort to perform content simplification, summarization, and enhancement.

**Data Handling**: (related to individuals)
###### Internal (Intranet)
* N/A

###### External (Internet)
* The users' IBM ID is persisted using JSON configuration lookup table without any password for the purpose of "_Authorization Verification_" to the demo application running to exercise API functionality.
* The sign-on is done with IBM ID and password and authenticated against external IBM ID (LDAP) for the purpose of "_Authentication_"
* The "email" (IBM ID) is stored in an application JSON configuration lookup table
* no password is stored in the application JSON configuration lookup table
* The purpose of the storage of email is for **Granting Access to the Demo Application and Corresponding API**
