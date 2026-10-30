import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from tests.test_career_course_filter_suite import (
    test_suite_a_machine_learning_engineer,
    test_suite_b_full_stack_developer,
    test_suite_c_cloud_data_engineer_and_filters,
    test_suite_d_unmapped_career_strict_empty_state,
    test_suite_e_student_isolation_and_progress_preservation,
)

if __name__ == "__main__":
    print("Running Test A: Machine Learning Engineer strict filtering...")
    test_suite_a_machine_learning_engineer()
    print("PASS: Test A passed successfully!")

    print("Running Test B: Full Stack Developer career switch and exclusion...")
    test_suite_b_full_stack_developer()
    print("PASS: Test B passed successfully!")

    print("Running Test C: Cloud Data Engineer, search, difficulty, priority, and login persistence...")
    test_suite_c_cloud_data_engineer_and_filters()
    print("PASS: Test C passed successfully!")

    print("Running Test D: Unmapped career strict empty state (no fallback)...")
    test_suite_d_unmapped_career_strict_empty_state()
    print("PASS: Test D passed successfully!")

    print("Running Test E: Student isolation and progress preservation...")
    test_suite_e_student_isolation_and_progress_preservation()
    print("PASS: Test E passed successfully!")

    print("\nALL CAREER COURSE FILTER TESTS PASSED PERFECTLY!")
