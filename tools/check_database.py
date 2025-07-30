#!/usr/bin/env python3

# Script to check for duplicates in database.js

def check_database_duplicates():
    with open('database.js', 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    print(f"Database.js has {len(lines)} lines")
    
    # Look for the class definition
    class_lines = []
    module_export_lines = []
    
    for i, line in enumerate(lines):
        if line.strip() == 'class UserDatabase {':
            class_lines.append(i+1)
        if line.strip() == 'module.exports = UserDatabase;':
            module_export_lines.append(i+1)
    
    print(f"Found 'class UserDatabase' at lines: {class_lines}")
    print(f"Found 'module.exports = UserDatabase;' at lines: {module_export_lines}")
    
    if len(class_lines) > 1 or len(module_export_lines) > 1:
        print("Duplicates detected in database.js!")
        
        # Find the midpoint where duplication might start
        if len(lines) > 400:
            midpoint = len(lines) // 2
            print(f"File is large ({len(lines)} lines), checking around midpoint {midpoint}")
            
            # Check if content is duplicated
            first_half = lines[:midpoint]
            second_half = lines[midpoint:]
            
            # Simple check: see if the beginning matches somewhere in the second half
            beginning_lines = lines[:50]  # First 50 lines
            for i in range(len(second_half) - 50):
                if second_half[i:i+50] == beginning_lines:
                    duplicate_start = midpoint + i
                    print(f"Found exact duplication starting at line {duplicate_start+1}")
                    return duplicate_start
    else:
        print("No duplicates found in database.js")
        return -1

if __name__ == "__main__":
    result = check_database_duplicates()
    if result != -1:
        print(f"Would remove content starting from line {result+1}")
    else:
        print("Database.js appears to be clean")
