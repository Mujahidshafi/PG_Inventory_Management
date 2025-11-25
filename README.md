<a id="readme-top"></a>
![image](https://github.com/user-attachments/assets/1c514d96-ffab-459d-aff8-07aef5d505c5)

# 🌾 Pleasant Grove Farms Inventory Management

An inventory tracking and management system built for Pleasant Grove Farms to streamline product data, storage, mill output, and sales.

![Next.js](https://img.shields.io/badge/Next.js-13-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ORM-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)
![Status](https://img.shields.io/badge/Status-Complete-brightgreen)

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
    <li><a href="#contributors">👥 Contributors</a></li>
  </ol>
</details>

## 💡 Why This Matters

Pleasant Grove Farms currently uses spreadsheets to manage over 3,000 acres of certified organic crop data. Our solution replaces this with a centralized, secure system that supports faster decisions, minimizes data loss, and boosts productivity. This app makes that transition seamless.

## Technologies
* [![React][React.js]][React-url]
* [![Next][Next.js]][Next-url]
* [![Tailwind][Tailwind.js]][Tailwind-url]
* [![PostgreSQL][PostgreSQL.js]][PostgreSQL-url]
* [![Supabase][Supabase.js]][Supabase-url]
* [![Jest][Jest.js]][Jest-url]
* [![Vercel][Vercel.js]][Vercel-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## ✨Features
- Admin login and role-based access
- Inventory CRUD (Create, Read, Update, Delete)
- Mill Job tracking and outputs
- Search by year, location, and product
- Transfer and location update pages
- ERD-based database structure

  
## Front End Visuals
Here are some visuals from our product:<br>
<details>
  <summary>Visuals</summary>
  <ol>
    <li><a href="#login-page-">Login Page</a></li>
    <li><a href="#employee-menu-">Employee Menu</a></li>
    <li><a href="#admin-menu-">Admin Menu</a></li>
    <li><a href="#new-field-run-">New Field Run</a></li>
    <li><a href="#transfer-">Transfer</a></li>
    <li><a href="#adddelete-items-">Add/Delete Items</a></li>
    <li><a href="#create-job-">Create Job</a></li>
    <li><a href="#mixing-job-">Mixing Job</a></li>
    <li><a href="#qsage-job-">Qsage Job</a></li>
    <li><a href="#sortex-job-">Sortex Job</a></li>
    <li><a href="#bagging-job-">Bagging Job</a></li>
    <li><a href="#storage-dashboard-">Storage Dashboard</a></li>
    <li><a href="#clean-storage-">Clean Storage</a></li>
    <li><a href="#search-">Search</a></li>
    <li><a href="#reports-">Reports</a></li>
    <li><a href="#order-fulfillment-">Order Fulfillment</a></li>
  </ol>
</details>

### Login Page: <br>
This is the landing page where users can log in using their email and password.
<img width="1915" height="913" alt="Image" src="https://github.com/user-attachments/assets/7d737a41-f881-4e60-897c-e54f43534293" />

### Employee Menu: <br>
The employee menu provides access to limited functionality, including the New Field Run, Transfer, Jobs, and Update Location pages.
<img width="1919" height="911" alt="Image" src="https://github.com/user-attachments/assets/5c5b3270-4a69-4911-9a64-805ac16fe559" />

### Admin Menu: <br>
The admin menu includes all employee features plus administrative tools such as adding and deleting locations, products, sale items, and users.
<img width="1919" height="911" alt="Image" src="https://github.com/user-attachments/assets/aca9fcbd-1c96-497f-808d-16a8e76731bb" />

### New Field Run: <br>
This page allows users to record a new field run — an incoming load of product from the fields.
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/df23224a-eed9-48dc-bc42-80ab7686cdc1" />

### Transfer: <br>
Used to transfer a specified weight of product between storage silos.
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/7eb3ac74-bab4-4c8b-8a30-4accd46f1e76" />

### Add/Delete Items: <br>
Provides admins with tools to add or remove storage locations, customers, or other configurable items.
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/9282b3c9-6591-4c99-84a9-d3fe8b04a91c" />

### Create Job: <br>
Enables admins to create and schedule new jobs for later execution.
<img width="1919" height="910" alt="Image" src="https://github.com/user-attachments/assets/43001e4c-d76d-46b1-9447-be5215d1fb4b" />

### Mixing Job: <br>
Used by admins to run a mixing job involving two product boxes.
<img width="1917" height="910" alt="Image" src="https://github.com/user-attachments/assets/2fc3b8e1-3266-43ff-b65b-04d485a9d67b" />

### Qsage Job: <br>
Allows admins to run, record, and complete a Qsage job.
<img width="1918" height="909" alt="Image" src="https://github.com/user-attachments/assets/aa4a8073-34d7-4024-a149-4c3cdafc9676" />

### Sortex Job: <br>
Allows admins to run, record, and complete a Qsage job.
<img width="1919" height="910" alt="Image" src="https://github.com/user-attachments/assets/7d4f91fa-6ce2-47fd-b2b9-6177eb5ab3ac" />

### Bagging Job: <br>
Enables admins to manage and record bagging operations for finished products.
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/9bfd9130-5443-4853-ac35-75a7f3d6ac06" />

### Storage Dashboard: <br>
Displays navigation to all storage categories, including field run, screening, and clean storage.
<img width="1918" height="909" alt="Image" src="https://github.com/user-attachments/assets/df0f0263-6630-4172-a363-dd488f430a1c" />

### Clean Storage: <br>
This is a storage page example, it lists clean storage items organized by product, with search filters for lot numbers.
<img width="1917" height="910" alt="Image" src="https://github.com/user-attachments/assets/5c0ca768-6527-42fd-beed-4ea2b662db33" />

### Search: <br>
Allows admins to search by lot number, location, or product, with optional filters for year and product type.
<img width="1918" height="909" alt="Image" src="https://github.com/user-attachments/assets/7441900b-bde0-4882-9d54-60c3aa1f99a3" />

### Reports: <br>
Displays all available reports for completed jobs. Admins can search by process ID, lot number, or product.
<img width="1919" height="909" alt="Image" src="https://github.com/user-attachments/assets/2416c733-0b8d-4cd5-aa73-13c565a13f5f" />

### Order Fulfillment: <br>
Allows admins to create, update, and complete orders, as well as view all active and completed orders.
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/f8eaf5e9-bf96-429d-8525-7920046bd8ba" />

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Back End Visuals
This is our Entity Relationship Diagram:

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Developer Instructions
How to download and setup to run.
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing 
All of our tests are located in the __tests__ folder at the root of our project.
These tests help ensure that the core features and components work before deployment.

Tools used: Jest and the React Testing Library.

Unit Testing: Valifating individual components, funcitons, and utilities in isolation.
Integration Testing: Ensure that multiple components or modules work cohesively together.

Tests can be conducted after fully downloading the project.
  1. Open project in visual studio code (Skip steps 2 and 3 if Terminal already open)
  2. Click the View button on the top left corner
  3. Click Terminal
  4. Type the command below and then press enter key

    npm init jest@latest
  5. In the Terminal type the command below and then press enter key

    npm test
     
This should run all the test that are in __tests__ folder

NOTE: Tests can also be individually run.

Example: 
        
    npm test -- __tests__/cleanStorage.test.js
                
Details: 
    
    npm test -- __tests__(file name)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment 
How to deploy the app.
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributors
[![Contributors](https://contrib.rocks/image?repo=Mujahidshafi/PG_Inventory_Management)](https://github.com/Mujahidshafi/PG_Inventory_Management/graphs/contributors)

### Team Contacts

- [Mujahid Shafi](https://github.com/Mujahidshafi) — muja.shafi@gmail.com
- [Amber Aring](https://github.com/aaring25) — mailto:aring.amber@gmail.com
- [Purity Maina](https://github.com/p-maina) — mailto:puritymainam@gmail.com
- [Gene Arellano](https://github.com/genearellano) — mailto:kenare1431@gmail.com
- [Anjoe Mateo](https://github.com/anmateo) — useramateo@gmail.com
- [Lamba Mujadedi](https://github.com/lambamojo) — lambamojo123@gmail.com
- [Subhanullah Lalzai](https://github.com/Subhan-4) — subhanullahmomand3@gmail.com
- [Hamzah Ramzan](https://github.com/Bahamas360) — mramzan331@gmail.com

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[PostgreSQL.js]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Supabase.js]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[Vercel.js]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/
[Tailwind.js]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Jest.js]: https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white
[Jest-url]: https://jestjs.io/
