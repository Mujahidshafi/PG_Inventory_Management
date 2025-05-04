<a id="readme-top"></a>
![image](https://github.com/user-attachments/assets/1c514d96-ffab-459d-aff8-07aef5d505c5)

## Inventory Management System for Pleasant Grove Farms

Our team the Syntax Stingers are building a simple and efficient inventory management system for Pleasant Grove Farms. Their current process relies on the management of spreadsheets. This makes it difficult to keep track of what they have in stock. Our system will make it easier for them by having everything they need in an intuitive and organized interface.

Key solutions:

* 🧠 A clean, easy-to-use dashboard to view and update inventory
* 🔄 Real-time updates so users always know what's in stock
* 👥 Separate access levels for admins and regular users help maintain security
* 🗃️ A reliable database to store all their product, user, and sales data
* 🔐 Includes a secure login system with password protection

What makes our team’s solution unique:

 * No unnecessary complexity
 * Next.js and PostgreSQL for speed and reliability
 * Serverless — cheaper to host and easier to maintain
 * Designed to grow with their needs — we can always add more features later

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#technologies">🛠 Technologies</a></li>
    <li><a href="#features">✨ Features</a></li>
    <li><a href="#front-end-visuals">🎨 Front End Visuals</a></li>
    <li><a href="#back-end-visuals">🧠 Back End Visuals</a></li>
    <li><a href="#developer-instructions">🧪 Developer Instructions</a></li>
    <li><a href="#testing">🧪 Testing</a></li>
    <li><a href="#deployment">🚀 Deployment</a></li>
    <li><a href="#timeline">⏱ Timeline</a></li>
    <li><a href="#contributors">👥 Contributors</a></li>
  </ol>
</details>

## Technologies
* [![React][React.js]][React-url]
* [![Next][Next.js]][Next-url]
* [![PostgreSQL][PostgreSQL.js]][PostgreSQL-url]
* [![Vercel][Vercel.js]][Vercel-url]
* [![Tailwind][Tailwind.js]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## ✨Features
- Admin login and role-based access
- Inventory CRUD (Create, Read, Update, Delete)
- Mill Job tracking and outputs
- Search by year, location, and product
- Transfer and location update pages
- ERD-based database structure

  
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Back End Visuals
This is our current Entity Relationship Diagram:

![Image](https://github.com/user-attachments/assets/1c78b170-6c83-4049-b365-7082498c1206)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Developer Instructions
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing 
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment 
<p align="right">(<a href="#readme-top">back to top</a>)</p>

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
 * The creation of our database is essential for the continuation of our project, and due to that it is placed in Sprint 05
 * Several of our pages depend on data produced by other pages. For example:
   * New Field Run- allows the user to input data to begin manipulating
   * Create Job- allows for job creation, which can then be viewed/manipulated through the View Job, Run Job, and In Process Pages
   * Search- supports the Search History and Search Modify pages
 * These pages are planned for earlier on due to their dependencies to prevent possible functional issues

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributors

[![Contributors](https://contrib.rocks/image?repo=Mujahidshafi/PG_Inventory_Management)](https://github.com/Mujahidshafi/PG_Inventory_Management/graphs/contributors)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[PostgreSQL.js]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Vercel.js]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/
[Tailwind.js]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
