import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

def load_json(filename):
    candidates = [
        os.path.join(PROJECT_ROOT, 'data-source', filename),
        os.path.join(PROJECT_ROOT, 'data-cache', filename),
        os.path.join(PROJECT_ROOT, 'src', 'data', filename),
        os.path.join('data-source', filename),
        os.path.join('data-cache', filename),
        os.path.join('src', 'data', filename)
    ]
    for p in candidates:
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                return json.load(f)
    return []

def main():
    customers = load_json('customers.json')
    cust_map = load_json('customer_mapping.json')
    bu_map = load_json('bu_mapping.json')
    skygeni = load_json('skygeni.json')
    
    print(f"Health Customers: {len(customers)} (Expected 37)")
    print(f"Customer Mapping Rows: {len(cust_map)} (Expected 466)")
    print(f"BU Mapping Rows: {len(bu_map)} (Expected 37)")
    print(f"Skygeni Rows: {len(skygeni)} (Expected ~2198)")
    
    accounts = set([r['account_name'] for r in skygeni])
    print(f"Unique Skygeni Accounts: {len(accounts)} (Expected 258)")
    
    # Check if every health customer matches at least one skygeni account
    unmatched = []
    for c in customers:
        cname = c['customer_name'].lower().strip()
        matched_skygeni = False
        for m in cust_map:
            if m['logical_customer'].lower().strip() == cname:
                val = m['value'].lower().strip()
                for a in accounts:
                    if a.lower().strip() == val:
                        matched_skygeni = True
                        break
                if matched_skygeni:
                    break
        if not matched_skygeni:
            unmatched.append(c['customer_name'])
            
    if unmatched:
        print(f"WARNING: {len(unmatched)} customers did not match any skygeni account:")
        for u in unmatched: print(f" - {u}")
    else:
        print("All health customers match at least one skygeni account.")
        
    print("Check complete.")

if __name__ == '__main__':
    main()
