![image](https://github.com/user-attachments/assets/1c514d96-ffab-459d-aff8-07aef5d505c5)

## Inventory Management System for Pleasant Grove Farms

Our team the Syntax Stingers are building a simple and efficient inventory management system for Pleasant Grove Farms. Their current process relies on the management of spreadsheets. This makes it difficult to keep track of what they have in stock. Our system will make it easier for them by having everything they need in an intuitive and organized interface.

Key solutions:

* A clean, easy-to-use dashboard to view and update inventory
  Real-time updates so they always know what is in stock
  Separate access for admins and regular users to keep things secure
* A reliable database to store all their product, user, and sales info
  Secure login system with password protection

What makes our team’s solution unique:

 * No unnecessary complexity
 * Next.js and PostgreSQL for speed and reliability
 * Serverless — cheaper to host and easier to maintain
 * Designed to grow with their needs — we can always add more features later

## Front End Visuals
We used Figma to create a prototype for the project, here are some examples from that prototype:<br>
Login Interface:
![Image](https://github.com/user-attachments/assets/1d0cc273-ae7f-460b-b0f4-80cd45ae5da5)

Admin Dashboard:
![Image](https://github.com/user-attachments/assets/18c533b2-bd04-4f16-9873-79229cf34af0)

Search Page:
![Image](https://github.com/user-attachments/assets/3b3113f3-6f48-40ee-9ebd-0853505de361)

Running Job Page:
![Image](https://github.com/user-attachments/assets/68829f99-d86c-4911-97d4-56d9a658e5ca)

## Back End Visualization
This is our current Entity Relationship Diagram:

![Image](https://github.com/user-attachments/assets/1c78b170-6c83-4049-b365-7082498c1206)

## Developer Instructions
This website uses next.js with react for the front end and tailwind for the styling. The database will be PostgreSQL. 

## Testing 

## Deployment
This website will be deployed on vercel for easy deployment. 

## Timeline
Current Timeline Estimate:
| Sprint #       | Planned Tasks                                                                                                                                              |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Sprint 05      | Back End Structure Creation and Front End Retouch/Linking                                                                                                  |
| Sprint 06      | Back End Creation for Login/New Field Run/Create Job/<br>Update Location/Transfer Pages                                                                    |
| Sprint 07      | Back End Creation for Search/Add New Items/Delete Items/<br>Run Job/View Job Pages                                                                         |
| Sprint 08      | Back End Creation for Search Modify/Search History/<br>Field Run Storage/Clean Storage/Screening Storage Pages and<br>Front End Creation for Search History|
| Sprint 09      | Back End Creation for Field Run Modify/Clean Storage Modify/<br>Screening Storage Modify/Sale Page/In Process Pages<br>and any other needed modifications  |

Key Milestones:
 * The creation of our database is essential for the continution of our project, and due to that it is placed in Sprint 05
 * Several of our pages depend on data produced by other pages. For example:
   * New Field Run- allows the user to input data to begin manipulating
   * Create Job- allows for job creation, which can then be viewed/manipulated through the View Job, Run Job, and In Process Pages
   * Search- supports the Search History and Search Modify pages
 * These pages are planned for earlier on due to their dependencies to prevent possible function problems

## Contributors

[![Contributors](https://contrib.rocks/image?repo=Mujahidshafi/PG_Inventory_Management)](https://github.com/Mujahidshafi/PG_Inventory_Management/graphs/contributors)
