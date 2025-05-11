# Code Callenge
## **Kevin Coscarelli** code challenge submission for **BLAST**
---
### Potential Improvements
- Add responsive styles. In the current state, it only looks good on desktop.
- The text parsing should have no place in the client side, but I kept it this way for the sake of simplicity. Assuming the match logs come from a third party server, a good solution would be having a cron job that runs right after every relevant match and parses the log into a JSON Blob to be stored in a database.
- Breakdown React component strcture: make a generic chart component and move all JSX and hook logic there.
- Maybe make fancier charts with D3. But that's just me.


Hope you like my solution 🫡