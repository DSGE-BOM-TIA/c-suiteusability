import streamlit as st
import requests

API = "http://localhost:3000"
SCENARIO_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

st.set_page_config(page_title="Circular Decision Dashboard", layout="wide")

st.title("Circular Economy Decision Dashboard")

# Run scenario
if st.button("Run Scenario"):
    res = requests.get(f"{API}/scenarios/{SCENARIO_ID}/run").json()
    brief = requests.get(f"{API}/scenarios/{SCENARIO_ID}/brief").json()

    st.subheader("Decision")
    st.metric("Recommendation", res["decision"])

    st.subheader("KPIs")
    col1, col2, col3 = st.columns(3)
    col1.metric("Margin %", f"{res['kpis']['marginPct']:.1f}%")
    col2.metric("Revenue", f"${res['kpis']['revenue']}")
    col3.metric("Total Cost", f"${res['kpis']['totalCost']:.2f}")

    st.subheader("Cost Drivers")
    st.write(res["drivers"])

    st.subheader("Executive Brief")
    st.info(brief["brief"])
