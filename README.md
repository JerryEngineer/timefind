# TimeFind

Pick a date range, have two people mark which days they're free, and see
the overlap. No accounts — create an event and share its link
(`localhost:5173/<id>`) with the other person.

Events are stored as JSON files on disk by a small local API server (see
`api/`); nothing is deployed or cloud-hosted yet.

Run the frontend and API in two terminals:

```
npm install
npm run dev
```

```
cd api
npm install
npm run dev
```
