#!/bin/bash
(cd oracle-service && npm start) &
sleep 3 && cd frontend && npm run dev
