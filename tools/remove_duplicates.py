#!/usr/bin/env python3

# Script to remove duplicate content from index.js

def remove_duplicates():
    # Read the file
    with open('index.js', 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    print(f"Total lines in file: {len(lines)}")
    
    # Find where we have the dashboard endpoint followed by duplicate content
    duplicate_start = -1
    
    # Look for the pattern: dashboard endpoint completion followed by "// NEW USER MANAGEMENT API ENDPOINTS"
    for i, line in enumerate(lines):
        if '// NEW USER MANAGEMENT API ENDPOINTS' in line:
            print(f"Found '// NEW USER MANAGEMENT API ENDPOINTS' at line {i+1}")
            # Check if this is the second occurrence (duplicate)
            # Look backwards to see if we already had the complete server setup
            found_first_occurrence = False
            for j in range(0, i):
                if '// NEW USER MANAGEMENT API ENDPOINTS' in lines[j]:
                    found_first_occurrence = True
                    break
            
            if found_first_occurrence:
                print(f"This is the duplicate occurrence at line {i+1}")
                # Look backwards for the end of the dashboard endpoint
                for k in range(i-1, max(0, i-50), -1):
                    if '});' in lines[k] and ('dashboard' in lines[k-5:k+1] or any('dashboard' in l for l in lines[max(0,k-10):k])):
                        duplicate_start = k
                        print(f"Found end of dashboard at line {k+1}, removing from line {k+2}")
                        break
                if duplicate_start != -1:
                    break
    
    if duplicate_start == -1:
        print("Could not find duplicate section start")
        # Let's try a different approach - look for the literal pattern
        for i, line in enumerate(lines):
            if line.strip() == "// NEW USER MANAGEMENT API ENDPOINTS":
                # Check if there's another occurrence before this
                for j in range(0, i):
                    if lines[j].strip() == "// NEW USER MANAGEMENT API ENDPOINTS":
                        print(f"Found duplicate starting at line {i+1}")
                        duplicate_start = i
                        break
                if duplicate_start != -1:
                    break
    
    if duplicate_start == -1:
        print("Still could not find duplicate. Let's check what's around the expected duplicate area:")
        # Look around lines 1840-1850
        start_check = max(0, 1830)
        end_check = min(len(lines), 1860)
        for i in range(start_check, end_check):
            print(f"Line {i+1}: {lines[i]}")
        return False
    
    # Keep everything up to the duplicate_start (exclusive)
    clean_lines = lines[:duplicate_start]
    
    # Write the cleaned content back
    with open('index.js', 'w') as f:
        f.write('\n'.join(clean_lines) + '\n')
    
    print(f"Removed duplicate content starting from line {duplicate_start+1}")
    print(f"Original file: {len(lines)} lines")
    print(f"Cleaned file: {len(clean_lines)} lines")
    return True

if __name__ == "__main__":
    remove_duplicates()
