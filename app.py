import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

st.set_page_config(page_title="বৃক্ষরোপণ তথ্য সংগ্রহ", layout="wide")

# HTML ফাইলটি পড়ুন
html_file = Path("index.html")
if html_file.exists():
    html_content = html_file.read_text(encoding="utf-8")
    # components.html ব্যবহার করে HTML রেন্ডার করুন
    # উচ্চতা বড় সেট করুন যাতে সম্পূর্ণ ফর্ম দেখা যায়
    components.html(html_content, height=2000, scrolling=True)
else:
    st.error("index.html ফাইল পাওয়া যায়নি, অনুগ্রহ করে রিপোজিটরির ফাইল স্ট্রাকচার পরীক্ষা করুন।")