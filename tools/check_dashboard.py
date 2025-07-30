#!/usr/bin/env python3

# Script to check for duplicates in dashboard.html

def check_dashboard_duplicates():
    with open('views/dashboard.html', 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    print(f"Dashboard.html has {len(lines)} lines")
    
    # Look for key markers
    doctype_lines = []
    html_end_lines = []
    script_start_lines = []
    
    for i, line in enumerate(lines):
        if line.strip() == '<!DOCTYPE html>':
            doctype_lines.append(i+1)
        if line.strip() == '</html>':
            html_end_lines.append(i+1)
        if '<script>' in line.strip():
            script_start_lines.append(i+1)
    
    print(f"Found '<!DOCTYPE html>' at lines: {doctype_lines}")
    print(f"Found '</html>' at lines: {html_end_lines}")
    print(f"Found '<script>' at lines: {script_start_lines}")
    
    if len(doctype_lines) > 1 or len(html_end_lines) > 1:
        print("Duplicates detected in dashboard.html!")
        return True
    else:
        print("No duplicates found in dashboard.html")
        return False

if __name__ == "__main__":
    check_dashboard_duplicates()
