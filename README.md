# Unified Banking Portal

I am building a Event-driven-Banking-Application using spring boot tech stack.

This application mainly consists of three main users, CUSTOMER, SYSTEM ADMIN and BANK ADMIN.

The customer is straight forward, the Bank admin is the one that manages all the bank related super user, and system admin is the one that has infrastructure access.

The customer have access to user Management, account Management and other banking operations.

The customer can only raise request to user creation and account creation, approval has to be provided by the bank admin.

One feature that i want to have is that all these three users would login on via same page, but based on the role assigned and permissions the ui has to loaded dynamically.

I want you to plan and design me the front-end application for this.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/090768e5-31db-4c04-b88b-f31e8cca1a62).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

*Note: Lovable AI features (like the `ask` CLI assist and AI request reviews) as well as the Lovable runtime error reporting have been removed from the production build so that the application has zero runtime dependencies on the Lovable platform.*

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
