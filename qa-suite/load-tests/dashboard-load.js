import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
    vus: 10,
    duration: '30s',
};

export default function () {
    // Replace with the actual API endpoint
    let res = http.get("http://localhost:3000/api/dashboard");

    check(res, {
        "status 200": r => r.status === 200,
        "fast response": r => r.timings.duration < 500
    });

    sleep(1);
}
