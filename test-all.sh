#!/bin/bash
# Comprehensive End-to-End Test Script for Car Affair Backend
# ============================================================

BASE="http://localhost:3001"
PASS=0
FAIL=0
ISSUES=""

green() { echo -e "\033[32m  PASS: $1\033[0m"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m  FAIL: $1\033[0m"; FAIL=$((FAIL+1)); ISSUES="$ISSUES\n- $1"; }

check_success() {
    local resp="$1"
    local label="$2"
    local success=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null)
    if [ "$success" = "True" ] || [ "$success" = "true" ] || [ "$success" = "True" ]; then
        green "$label"
    else
        red "$label — Response: $(echo "$resp" | head -c 200)"
    fi
}

check_status() {
    local http_code="$1"
    local expected="$2"
    local label="$3"
    if [ "$http_code" = "$expected" ]; then
        green "$label (HTTP $http_code)"
    else
        red "$label — Expected HTTP $expected, got $http_code"
    fi
}

extract() {
    echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null
}

echo "========================================"
echo "  CAR AFFAIR — FULL E2E TEST SUITE"
echo "========================================"
echo ""

# ========================================
# 1. AUTH FLOW
# ========================================
echo "--- 1. AUTH FLOW ---"
echo ""

# 1a. Send OTP — all roles
for ROLE in super_admin garage_admin customer vendor; do
    PHONE="9999999999"
    [ "$ROLE" = "garage_admin" ] && PHONE="8888888888"
    [ "$ROLE" = "customer" ] && PHONE="7777777777"
    [ "$ROLE" = "vendor" ] && PHONE="6666666666"
    R=$(curl -s "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d "{\"phone\":\"$PHONE\",\"role\":\"$ROLE\"}")
    check_success "$R" "Send OTP ($ROLE)"
done

echo ""

# 1b. Verify OTP — Super Admin
SA_RESP=$(curl -s "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"9999999999","otp":"123456","role":"super_admin"}')
check_success "$SA_RESP" "Verify OTP (super_admin)"
SA_TOKEN=$(extract "$SA_RESP" "['data']['accessToken']")
SA_REFRESH=$(extract "$SA_RESP" "['data']['refreshToken']")
SA_ROLE=$(extract "$SA_RESP" "['data']['role']")
[ "$SA_ROLE" = "super_admin" ] && green "Super Admin role correct" || red "Super Admin role incorrect: $SA_ROLE"

# Verify response has all expected fields
SA_FIELDS=$(echo "$SA_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
expected = ['accessToken','refreshToken','userId','name','phone','role']
missing = [f for f in expected if f not in d]
print('OK' if not missing else 'MISSING: ' + ','.join(missing))
" 2>/dev/null)
[ "$SA_FIELDS" = "OK" ] && green "Super Admin response has all fields" || red "Super Admin response fields: $SA_FIELDS"

echo ""

# 1c. Verify OTP — Wrong OTP (send fresh OTP first)
curl -s "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"1111111111","role":"customer"}' > /dev/null
WRONG_OTP_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"1111111111","otp":"000000","role":"customer"}')
check_status "$WRONG_OTP_RESP" "401" "Verify OTP with wrong OTP returns 401"

# 1d. Verify OTP — Missing fields
MISSING_FIELDS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"9999999999"}')
# Could be 400 or 401
[ "$MISSING_FIELDS" = "400" ] || [ "$MISSING_FIELDS" = "401" ] && green "Verify OTP missing fields returns error ($MISSING_FIELDS)" || red "Verify OTP missing fields — Expected 400/401, got $MISSING_FIELDS"

# 1e. Refresh Token
REFRESH_RESP=$(curl -s "$BASE/api/auth/refresh" -X POST -H "Content-Type: application/json" -d "{\"refreshToken\":\"$SA_REFRESH\"}")
check_success "$REFRESH_RESP" "Refresh token"
NEW_TOKEN=$(extract "$REFRESH_RESP" "['data']['accessToken']")
[ -n "$NEW_TOKEN" ] && green "Refresh returns new access token" || red "Refresh did not return new access token"

# 1f. Refresh with invalid token
INVALID_REFRESH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/refresh" -X POST -H "Content-Type: application/json" -d '{"refreshToken":"invalid.token.here"}')
check_status "$INVALID_REFRESH" "401" "Refresh with invalid token returns 401"

echo ""

# ========================================
# 2. SUPER ADMIN — GARAGE MANAGEMENT
# ========================================
echo "--- 2. SUPER ADMIN — GARAGE MANAGEMENT ---"
echo ""

# 2a. Create Garage
CREATE_GARAGE=$(curl -s "$BASE/api/garages" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SA_TOKEN" -d '{
    "name": "Test Garage Hyderabad",
    "ownerName": "Test Owner",
    "phone": "8888888888",
    "email": "test@garage.com",
    "address": "Test Address, Hyderabad",
    "gstNumber": "36AABCT1234F1Z5"
}')
check_success "$CREATE_GARAGE" "Create garage"
GARAGE_ID=$(extract "$CREATE_GARAGE" "['data']['id']")
echo "  Garage ID: $GARAGE_ID"

# 2b. List Garages
LIST_GARAGES=$(curl -s "$BASE/api/garages" -H "Authorization: Bearer $SA_TOKEN")
check_success "$LIST_GARAGES" "List garages"
GARAGE_COUNT=$(echo "$LIST_GARAGES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "  Total garages: $GARAGE_COUNT"

# 2c. Get Garage by ID
if [ -n "$GARAGE_ID" ]; then
    GET_GARAGE=$(curl -s "$BASE/api/garages/$GARAGE_ID" -H "Authorization: Bearer $SA_TOKEN")
    check_success "$GET_GARAGE" "Get garage by ID"

    # Check isActive field
    IS_ACTIVE=$(extract "$GET_GARAGE" "['data']['isActive']")
    [ "$IS_ACTIVE" = "True" ] || [ "$IS_ACTIVE" = "true" ] && green "Garage isActive field correct (not 'active')" || red "Garage isActive field issue: $IS_ACTIVE"
fi

# 2d. Update Garage
if [ -n "$GARAGE_ID" ]; then
    UPDATE_GARAGE=$(curl -s "$BASE/api/garages/$GARAGE_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $SA_TOKEN" -d '{
        "name": "Test Garage Hyderabad Updated",
        "ownerName": "Test Owner Updated",
        "phone": "8888888888",
        "email": "updated@garage.com",
        "address": "Updated Address, Hyderabad"
    }')
    check_success "$UPDATE_GARAGE" "Update garage"
    UPDATED_NAME=$(extract "$UPDATE_GARAGE" "['data']['name']")
    [ "$UPDATED_NAME" = "Test Garage Hyderabad Updated" ] && green "Garage name updated correctly" || red "Garage name not updated: $UPDATED_NAME"
fi

# 2e. Garage Dashboard
if [ -n "$GARAGE_ID" ]; then
    DASHBOARD=$(curl -s "$BASE/api/garages/$GARAGE_ID/dashboard" -H "Authorization: Bearer $SA_TOKEN")
    check_success "$DASHBOARD" "Garage dashboard"

    # Check dashboard has expected fields
    DASH_FIELDS=$(echo "$DASHBOARD" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
expected = ['garageId','garageName','isActive','totalCustomers','totalVehicles','totalOrders','totalRevenue']
missing = [f for f in expected if f not in d]
print('OK' if not missing else 'MISSING: ' + ','.join(missing))
" 2>/dev/null)
    [ "$DASH_FIELDS" = "OK" ] && green "Dashboard has all expected stat fields" || red "Dashboard fields: $DASH_FIELDS"
fi

echo ""

# ========================================
# 3. LOGIN AS GARAGE ADMIN
# ========================================
echo "--- 3. GARAGE ADMIN LOGIN ---"
echo ""

# Send OTP for the garage admin phone
curl -s "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"8888888888","role":"garage_admin"}' > /dev/null

GA_RESP=$(curl -s "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"8888888888","otp":"123456","role":"garage_admin"}')
check_success "$GA_RESP" "Verify OTP (garage_admin)"
GA_TOKEN=$(extract "$GA_RESP" "['data']['accessToken']")
GA_GARAGE_ID=$(extract "$GA_RESP" "['data']['garageId']")
GA_GARAGE_NAME=$(extract "$GA_RESP" "['data']['garageName']")
echo "  Garage Admin Token: ${GA_TOKEN:0:20}..."
echo "  Garage ID: $GA_GARAGE_ID"
echo "  Garage Name: $GA_GARAGE_NAME"

[ -n "$GA_TOKEN" ] && green "Garage admin token obtained" || red "Failed to get garage admin token"
[ -n "$GA_GARAGE_ID" ] && green "Garage admin has garageId in JWT" || red "Garage admin missing garageId"

echo ""

# ========================================
# 4. CUSTOMERS CRUD
# ========================================
echo "--- 4. CUSTOMERS CRUD ---"
echo ""

# 4a. Create Customer
CREATE_CUST=$(curl -s "$BASE/api/customers" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "name": "Ravi Kumar",
    "phone": "9876543210",
    "email": "ravi@email.com",
    "address": "Hyderabad",
    "gstin": "36AABCT9999F1Z5"
}')
check_success "$CREATE_CUST" "Create customer"
CUST_ID=$(extract "$CREATE_CUST" "['data']['id']")
echo "  Customer ID: $CUST_ID"

# 4b. List Customers
LIST_CUST=$(curl -s "$BASE/api/customers" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_CUST" "List customers"

# 4c. Get Customer by ID
if [ -n "$CUST_ID" ]; then
    GET_CUST=$(curl -s "$BASE/api/customers/$CUST_ID" -H "Authorization: Bearer $GA_TOKEN")
    check_success "$GET_CUST" "Get customer by ID"
    CUST_NAME=$(extract "$GET_CUST" "['data']['name']")
    [ "$CUST_NAME" = "Ravi Kumar" ] && green "Customer name correct" || red "Customer name incorrect: $CUST_NAME"
fi

# 4d. Update Customer
if [ -n "$CUST_ID" ]; then
    UPDATE_CUST=$(curl -s "$BASE/api/customers/$CUST_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
        "name": "Ravi Kumar Updated",
        "phone": "9876543210",
        "email": "ravi.updated@email.com",
        "address": "Secunderabad"
    }')
    check_success "$UPDATE_CUST" "Update customer"
fi

echo ""

# ========================================
# 5. VEHICLES CRUD
# ========================================
echo "--- 5. VEHICLES CRUD ---"
echo ""

# 5a. Create Vehicle
CREATE_VEH=$(curl -s "$BASE/api/vehicles" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d "{
    \"customerId\": \"$CUST_ID\",
    \"registrationNumber\": \"TS09AB1234\",
    \"brandName\": \"Maruti Suzuki\",
    \"modelName\": \"Swift\",
    \"fuelType\": \"Petrol\",
    \"category\": \"Hatchback\",
    \"year\": \"2022\"
}")
check_success "$CREATE_VEH" "Create vehicle"
VEH_ID=$(extract "$CREATE_VEH" "['data']['id']")
echo "  Vehicle ID: $VEH_ID"

# 5b. List Vehicles
LIST_VEH=$(curl -s "$BASE/api/vehicles" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_VEH" "List vehicles"

# 5c. Search Vehicle by Registration
SEARCH_VEH=$(curl -s "$BASE/api/vehicles/search?reg=TS09AB" -H "Authorization: Bearer $GA_TOKEN")
check_success "$SEARCH_VEH" "Search vehicle by registration"
SEARCH_COUNT=$(echo "$SEARCH_VEH" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(len(d) if isinstance(d, list) else 1)" 2>/dev/null)
[ "$SEARCH_COUNT" -ge 1 ] 2>/dev/null && green "Vehicle search found results ($SEARCH_COUNT)" || red "Vehicle search returned no results"

echo ""

# ========================================
# 6. REPAIR ORDERS LIFECYCLE
# ========================================
echo "--- 6. REPAIR ORDERS LIFECYCLE ---"
echo ""

# 6a. Create Order
CREATE_ORDER=$(curl -s "$BASE/api/orders" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d "{
    \"customerId\": \"$CUST_ID\",
    \"customerName\": \"Ravi Kumar\",
    \"phone\": \"9876543210\",
    \"vehicleId\": \"$VEH_ID\",
    \"vehicle\": \"Maruti Suzuki Swift\",
    \"vehicleNumber\": \"TS09AB1234\",
    \"services\": [\"General Service\", \"Oil Change\"],
    \"amount\": 4500,
    \"date\": \"2026-05-15\"
}")
check_success "$CREATE_ORDER" "Create order"
ORDER_ID=$(extract "$CREATE_ORDER" "['data']['id']")
JOB_CARD=$(extract "$CREATE_ORDER" "['data']['jobCard']")
ORDER_STATUS=$(extract "$CREATE_ORDER" "['data']['status']")
echo "  Order ID: $ORDER_ID"
echo "  Job Card: $JOB_CARD"
echo "  Status: $ORDER_STATUS"
[ -n "$JOB_CARD" ] && green "Order has auto-generated jobCard" || red "Order missing jobCard"
[ "$ORDER_STATUS" = "open" ] && green "New order status is 'open'" || red "New order status incorrect: $ORDER_STATUS"

# 6b. Get Order by ID
if [ -n "$ORDER_ID" ]; then
    GET_ORDER=$(curl -s "$BASE/api/orders/$ORDER_ID" -H "Authorization: Bearer $GA_TOKEN")
    check_success "$GET_ORDER" "Get order by ID"
fi

# 6c. Update Order Status (open → wip)
if [ -n "$ORDER_ID" ]; then
    UPDATE_ORDER=$(curl -s "$BASE/api/orders/$ORDER_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{"status": "wip"}')
    check_success "$UPDATE_ORDER" "Update order to WIP"
    NEW_STATUS=$(extract "$UPDATE_ORDER" "['data']['status']")
    [ "$NEW_STATUS" = "wip" ] && green "Order status updated to 'wip'" || red "Order status not updated: $NEW_STATUS"
fi

# 6d. Update Order Status (wip → completed)
if [ -n "$ORDER_ID" ]; then
    UPDATE_ORDER2=$(curl -s "$BASE/api/orders/$ORDER_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{"status": "completed", "amount": 5000}')
    check_success "$UPDATE_ORDER2" "Update order to completed"
    FINAL_STATUS=$(extract "$UPDATE_ORDER2" "['data']['status']")
    FINAL_AMOUNT=$(extract "$UPDATE_ORDER2" "['data']['amount']")
    [ "$FINAL_STATUS" = "completed" ] && green "Order status is 'completed'" || red "Order status: $FINAL_STATUS"
fi

# 6e. List Orders
LIST_ORDERS=$(curl -s "$BASE/api/orders" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_ORDERS" "List orders"

# 6f. Filter orders by status
OPEN_ORDERS=$(curl -s "$BASE/api/orders?status=open" -H "Authorization: Bearer $GA_TOKEN")
check_success "$OPEN_ORDERS" "Filter orders by status=open"

echo ""

# ========================================
# 7. INVENTORY — PARTS
# ========================================
echo "--- 7. INVENTORY — PARTS ---"
echo ""

CREATE_PART=$(curl -s "$BASE/api/parts" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "name": "Engine Oil 5W-30",
    "partNumber": "EO-530-001",
    "category": "Lubricants",
    "quantity": 50,
    "unitPrice": 450,
    "reorderLevel": 10,
    "vendor": "AutoParts India"
}')
check_success "$CREATE_PART" "Create part"
PART_ID=$(extract "$CREATE_PART" "['data']['id']")
echo "  Part ID: $PART_ID"

LIST_PARTS=$(curl -s "$BASE/api/parts" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_PARTS" "List parts"

if [ -n "$PART_ID" ]; then
    UPDATE_PART=$(curl -s "$BASE/api/parts/$PART_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
        "name": "Engine Oil 5W-30 Premium",
        "quantity": 45,
        "unitPrice": 500
    }')
    check_success "$UPDATE_PART" "Update part"
fi

echo ""

# ========================================
# 8. VENDORS
# ========================================
echo "--- 8. VENDORS ---"
echo ""

CREATE_VENDOR=$(curl -s "$BASE/api/vendors" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "name": "AutoParts India",
    "ownerName": "Suresh",
    "phone": "9876540001",
    "email": "suresh@autoparts.in",
    "address": "Industrial Area",
    "gstin": "36AABCT7777F1Z5"
}')
check_success "$CREATE_VENDOR" "Create vendor"
VENDOR_ID=$(extract "$CREATE_VENDOR" "['data']['id']")

LIST_VENDORS=$(curl -s "$BASE/api/vendors" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_VENDORS" "List vendors"

echo ""

# ========================================
# 9. PURCHASE ORDERS
# ========================================
echo "--- 9. PURCHASE ORDERS ---"
echo ""

CREATE_PO=$(curl -s "$BASE/api/purchase-orders" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d "{
    \"vendorId\": \"$VENDOR_ID\",
    \"vendorName\": \"AutoParts India\",
    \"items\": [{\"partName\": \"Engine Oil 5W-30\", \"quantity\": 20, \"unitPrice\": 400}],
    \"totalAmount\": 8000,
    \"status\": \"ordered\",
    \"date\": \"2026-05-15\"
}")
check_success "$CREATE_PO" "Create purchase order"
PO_ID=$(extract "$CREATE_PO" "['data']['id']")

LIST_PO=$(curl -s "$BASE/api/purchase-orders" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_PO" "List purchase orders"

echo ""

# ========================================
# 10. STOCK-IN
# ========================================
echo "--- 10. STOCK-IN ---"
echo ""

CREATE_STOCKIN=$(curl -s "$BASE/api/stock-in" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d "{
    \"purchaseOrderId\": \"$PO_ID\",
    \"vendorName\": \"AutoParts India\",
    \"items\": [{\"partName\": \"Engine Oil 5W-30\", \"quantity\": 20, \"unitPrice\": 400}],
    \"totalAmount\": 8000,
    \"date\": \"2026-05-15\",
    \"invoiceNumber\": \"INV-001\"
}")
check_success "$CREATE_STOCKIN" "Create stock-in record"

LIST_STOCKIN=$(curl -s "$BASE/api/stock-in" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_STOCKIN" "List stock-in records"

echo ""

# ========================================
# 11. COUNTER SALES
# ========================================
echo "--- 11. COUNTER SALES ---"
echo ""

CREATE_CS=$(curl -s "$BASE/api/counter-sales" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "customerName": "Walk-in Customer",
    "customerPhone": "9876549999",
    "items": [{"partName": "Engine Oil 5W-30", "quantity": 2, "unitPrice": 500}],
    "totalAmount": 1000,
    "paymentMode": "cash",
    "date": "2026-05-15"
}')
check_success "$CREATE_CS" "Create counter sale"

LIST_CS=$(curl -s "$BASE/api/counter-sales" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_CS" "List counter sales"

echo ""

# ========================================
# 12. INVOICES
# ========================================
echo "--- 12. INVOICES ---"
echo ""

CREATE_INV=$(curl -s "$BASE/api/invoices" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d "{
    \"orderId\": \"$ORDER_ID\",
    \"customerName\": \"Ravi Kumar\",
    \"customerPhone\": \"9876543210\",
    \"vehicleNumber\": \"TS09AB1234\",
    \"type\": \"tax\",
    \"items\": [{\"description\": \"General Service\", \"amount\": 3000}, {\"description\": \"Oil Change\", \"amount\": 2000}],
    \"totalAmount\": 5000,
    \"date\": \"2026-05-15\"
}")
check_success "$CREATE_INV" "Create invoice"
INVOICE_ID=$(extract "$CREATE_INV" "['data']['id']")

LIST_INV=$(curl -s "$BASE/api/invoices" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_INV" "List invoices"

if [ -n "$INVOICE_ID" ]; then
    GET_INV=$(curl -s "$BASE/api/invoices/$INVOICE_ID" -H "Authorization: Bearer $GA_TOKEN")
    check_success "$GET_INV" "Get invoice by ID"
fi

echo ""

# ========================================
# 13. SERVICE REMINDERS
# ========================================
echo "--- 13. SERVICE REMINDERS ---"
echo ""

CREATE_REM=$(curl -s "$BASE/api/service-reminders" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "customerName": "Ravi Kumar",
    "customerPhone": "9876543210",
    "vehicleNumber": "TS09AB1234",
    "vehicleName": "Maruti Suzuki Swift",
    "serviceType": "General Service",
    "lastServiceDate": "2026-05-15",
    "nextServiceDate": "2026-08-15",
    "status": "pending"
}')
check_success "$CREATE_REM" "Create service reminder"
REM_ID=$(extract "$CREATE_REM" "['data']['id']")

LIST_REM=$(curl -s "$BASE/api/service-reminders" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_REM" "List service reminders"

if [ -n "$REM_ID" ]; then
    UPDATE_REM=$(curl -s "$BASE/api/service-reminders/$REM_ID" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{"status": "sent"}')
    check_success "$UPDATE_REM" "Update reminder status"
fi

echo ""

# ========================================
# 14. SERVICE FEEDBACKS
# ========================================
echo "--- 14. SERVICE FEEDBACKS ---"
echo ""

CREATE_FB=$(curl -s "$BASE/api/service-feedbacks" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA_TOKEN" -d '{
    "customerName": "Ravi Kumar",
    "customerPhone": "9876543210",
    "vehicleNumber": "TS09AB1234",
    "vehicleName": "Maruti Suzuki Swift",
    "rating": 5,
    "comment": "Excellent service, very professional",
    "date": "2026-05-15",
    "services": ["General Service", "Oil Change"],
    "status": "pending"
}')
check_success "$CREATE_FB" "Create service feedback"

LIST_FB=$(curl -s "$BASE/api/service-feedbacks" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_FB" "List service feedbacks"

echo ""

# ========================================
# 15. REFERENCE DATA — BRANDS & MODELS
# ========================================
echo "--- 15. REFERENCE DATA ---"
echo ""

LIST_BRANDS=$(curl -s "$BASE/api/brands" -H "Authorization: Bearer $GA_TOKEN")
check_success "$LIST_BRANDS" "List brands"
BRAND_COUNT=$(echo "$LIST_BRANDS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "  Total brands: $BRAND_COUNT"
[ "$BRAND_COUNT" -ge 1 ] 2>/dev/null && green "Brands seeded ($BRAND_COUNT)" || red "No brands found"

# Get first brand ID for model query
FIRST_BRAND_ID=$(echo "$LIST_BRANDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
if [ -n "$FIRST_BRAND_ID" ]; then
    LIST_MODELS=$(curl -s "$BASE/api/models?brandId=$FIRST_BRAND_ID" -H "Authorization: Bearer $GA_TOKEN")
    check_success "$LIST_MODELS" "List models by brand"
    MODEL_COUNT=$(echo "$LIST_MODELS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
    echo "  Models for first brand: $MODEL_COUNT"
fi

echo ""

# ========================================
# 16. CUSTOMER PORTAL — PUBLIC BOOKING
# ========================================
echo "--- 16. CUSTOMER PORTAL ---"
echo ""

# 16a. Public booking (no auth required)
CREATE_BOOKING=$(curl -s "$BASE/api/bookings" -X POST -H "Content-Type: application/json" -d '{
    "service": "general",
    "customerName": "Portal Customer",
    "customerPhone": "7777777777",
    "customerEmail": "portal@customer.com",
    "address": "Hyderabad",
    "vehicleRegNumber": "TS10CD5678",
    "vehicleBrand": "Hyundai",
    "vehicleModel": "i20",
    "vehicleFuelType": "Petrol",
    "vehicleYear": "2023",
    "preferredDate": "2026-05-20",
    "preferredTime": "10:00 AM",
    "concerns": "AC not cooling properly",
    "pickDrop": true
}')
check_success "$CREATE_BOOKING" "Create public booking"
BOOKING_ID=$(extract "$CREATE_BOOKING" "['data']['bookingId']")
echo "  Booking ID: $BOOKING_ID"
[ -n "$BOOKING_ID" ] && green "Booking has auto-generated bookingId" || red "Booking missing bookingId"

# 16b. Partner signup (public)
PARTNER_SIGNUP=$(curl -s "$BASE/api/vendors/register" -X POST -H "Content-Type: application/json" -d '{
    "garageName": "Quick Fix Motors",
    "ownerName": "Raj",
    "phone": "6666666666",
    "email": "raj@quickfix.com",
    "location": "Bangalore",
    "fullAddress": "MG Road, Bangalore",
    "specialties": ["General Service", "AC Service"],
    "experience": 5,
    "bays": 3,
    "certifications": "ISO Certified"
}')
check_success "$PARTNER_SIGNUP" "Partner signup (portal vendor registration)"

# 16c. Customer Login + My Bookings
curl -s "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"7777777777","role":"customer"}' > /dev/null
CUST_LOGIN=$(curl -s "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"7777777777","otp":"123456","role":"customer"}')
check_success "$CUST_LOGIN" "Customer login"
CUST_TOKEN=$(extract "$CUST_LOGIN" "['data']['accessToken']")
CUST_PHONE=$(extract "$CUST_LOGIN" "['data']['phone']")
[ "$CUST_PHONE" = "7777777777" ] && green "Customer JWT includes phone" || red "Customer JWT missing phone: $CUST_PHONE"

# 16d. My Bookings
if [ -n "$CUST_TOKEN" ]; then
    MY_BOOKINGS=$(curl -s "$BASE/api/bookings" -H "Authorization: Bearer $CUST_TOKEN")
    check_success "$MY_BOOKINGS" "Get my bookings (customer)"
    BOOKING_COUNT=$(echo "$MY_BOOKINGS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
    [ "$BOOKING_COUNT" -ge 1 ] 2>/dev/null && green "Customer can see their bookings ($BOOKING_COUNT)" || red "Customer bookings empty (expected >= 1)"
fi

echo ""

# ========================================
# 17. ADMIN BOOKING MANAGEMENT
# ========================================
echo "--- 17. ADMIN BOOKING MANAGEMENT ---"
echo ""

ADMIN_BOOKINGS=$(curl -s "$BASE/api/admin/bookings" -H "Authorization: Bearer $GA_TOKEN")
check_success "$ADMIN_BOOKINGS" "Admin list bookings"

echo ""

# ========================================
# 18. MULTI-TENANCY TEST
# ========================================
echo "--- 18. MULTI-TENANCY TEST ---"
echo ""

# Create a second garage
CREATE_GARAGE2=$(curl -s "$BASE/api/garages" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SA_TOKEN" -d '{
    "name": "Test Garage Bangalore",
    "ownerName": "Second Owner",
    "phone": "5555555555",
    "email": "second@garage.com",
    "address": "MG Road, Bangalore",
    "gstNumber": "29AABCT5678F1Z5"
}')
check_success "$CREATE_GARAGE2" "Create second garage"
GARAGE2_ID=$(extract "$CREATE_GARAGE2" "['data']['id']")

# Login as second garage admin
curl -s "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"5555555555","role":"garage_admin"}' > /dev/null
GA2_RESP=$(curl -s "$BASE/api/auth/verify-otp" -X POST -H "Content-Type: application/json" -d '{"phone":"5555555555","otp":"123456","role":"garage_admin"}')
GA2_TOKEN=$(extract "$GA2_RESP" "['data']['accessToken']")
GA2_GARAGE_ID=$(extract "$GA2_RESP" "['data']['garageId']")

# Create customer in second garage
CREATE_CUST2=$(curl -s "$BASE/api/customers" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA2_TOKEN" -d '{
    "name": "Bangalore Customer",
    "phone": "9876500002",
    "email": "blr@email.com"
}')
check_success "$CREATE_CUST2" "Create customer in garage 2"

# List customers in garage 1 — should NOT contain garage 2's customer
G1_CUSTOMERS=$(curl -s "$BASE/api/customers" -H "Authorization: Bearer $GA_TOKEN")
G1_HAS_BLR=$(echo "$G1_CUSTOMERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
found = any(c.get('name') == 'Bangalore Customer' for c in data)
print('LEAK' if found else 'ISOLATED')
" 2>/dev/null)
[ "$G1_HAS_BLR" = "ISOLATED" ] && green "Multi-tenancy: Garage 1 cannot see Garage 2 customers" || red "Multi-tenancy LEAK: Garage 1 sees Garage 2 data"

# List customers in garage 2 — should NOT contain garage 1's customer
G2_CUSTOMERS=$(curl -s "$BASE/api/customers" -H "Authorization: Bearer $GA2_TOKEN")
G2_HAS_RAVI=$(echo "$G2_CUSTOMERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
found = any(c.get('name') == 'Ravi Kumar Updated' for c in data)
print('LEAK' if found else 'ISOLATED')
" 2>/dev/null)
[ "$G2_HAS_RAVI" = "ISOLATED" ] && green "Multi-tenancy: Garage 2 cannot see Garage 1 customers" || red "Multi-tenancy LEAK: Garage 2 sees Garage 1 data"

# Create order in garage 2, verify garage 1 can't see it
CREATE_VEH2=$(curl -s "$BASE/api/vehicles" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA2_TOKEN" -d '{
    "registrationNumber": "KA01XY9999",
    "brandName": "Honda",
    "modelName": "City",
    "fuelType": "Diesel",
    "year": "2023"
}')
VEH2_ID=$(extract "$CREATE_VEH2" "['data']['id']")

CREATE_ORDER2=$(curl -s "$BASE/api/orders" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $GA2_TOKEN" -d "{
    \"customerName\": \"Bangalore Customer\",
    \"phone\": \"9876500002\",
    \"vehicleId\": \"$VEH2_ID\",
    \"vehicle\": \"Honda City\",
    \"vehicleNumber\": \"KA01XY9999\",
    \"services\": [\"AC Service\"],
    \"amount\": 3000,
    \"date\": \"2026-05-15\"
}")
check_success "$CREATE_ORDER2" "Create order in garage 2"

G1_ORDERS=$(curl -s "$BASE/api/orders" -H "Authorization: Bearer $GA_TOKEN")
G1_HAS_HONDA=$(echo "$G1_ORDERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
found = any(o.get('vehicle') == 'Honda City' for o in data)
print('LEAK' if found else 'ISOLATED')
" 2>/dev/null)
[ "$G1_HAS_HONDA" = "ISOLATED" ] && green "Multi-tenancy: Orders isolated between garages" || red "Multi-tenancy LEAK: Orders leaking across garages"

echo ""

# ========================================
# 19. ERROR CASES
# ========================================
echo "--- 19. ERROR CASES ---"
echo ""

# 19a. Access without token
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/customers")
check_status "$NO_AUTH" "401" "Access without token returns 401"

# 19b. Access with invalid token
BAD_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/customers" -H "Authorization: Bearer invalid.token.here")
check_status "$BAD_TOKEN" "401" "Access with invalid token returns 401"

# 19c. 404 — Non-existent resource
NOT_FOUND_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/customers/000000000000000000000000" -H "Authorization: Bearer $GA_TOKEN")
check_status "$NOT_FOUND_RESP" "404" "Non-existent customer returns 404"

# 19d. Wrong role — Customer trying to access admin API
if [ -n "$CUST_TOKEN" ]; then
    WRONG_ROLE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/customers" -H "Authorization: Bearer $CUST_TOKEN")
    check_status "$WRONG_ROLE" "403" "Customer cannot access admin API (expected 403)"
fi

# 19e. Garage admin trying super admin API
GA_SUPER=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/garages" -H "Authorization: Bearer $GA_TOKEN")
check_status "$GA_SUPER" "403" "Garage admin cannot access super admin API (expected 403)"

# 19f. Send OTP with missing phone
MISSING_PHONE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/send-otp" -X POST -H "Content-Type: application/json" -d '{"role":"customer"}')
[ "$MISSING_PHONE" = "400" ] && green "Send OTP without phone returns 400" || red "Send OTP without phone returned $MISSING_PHONE (expected 400)"

echo ""

# ========================================
# RESULTS SUMMARY
# ========================================
echo "========================================"
echo "  TEST RESULTS SUMMARY"
echo "========================================"
echo -e "\033[32m  PASSED: $PASS\033[0m"
echo -e "\033[31m  FAILED: $FAIL\033[0m"
echo ""
if [ $FAIL -gt 0 ]; then
    echo "  Failed tests:"
    echo -e "$ISSUES"
fi
echo ""
echo "========================================"
