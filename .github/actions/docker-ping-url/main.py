import os;
import requests;
import time;

def ping_url(url, delay, max_trials):
    trials = 0

    while trials < max_trials:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("website {url} is reachable.")
                return True
        except requests.ConnectionError:
            print("Website {url} is not reachable. retrying to {delay} seconds...")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print("Invalid url format: {url} make sure the url has a valid schema")
            return False

def run():
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_URL"))
    max_trials = int(os.getenv("INPUT_URL"))

    website_reachable = ping_url(website_url, delay, max_trials)

    if not website_reachable:
        raise Exception("website {url} is not reachable")
    
    print("Website {url} is reachable")

if __name__ == "__main__":
    run()