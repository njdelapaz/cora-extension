// Test script for the Course Analyzer
// This can be run independently to test the analyzer functionality

import { config } from './config.js';
import { CourseAnalyzer } from './services/courseAnalyzer.js';

async function testCourseAnalyzer() {
  console.log('='.repeat(60));
  console.log('TESTING COURSE ANALYZER');
  console.log('='.repeat(60));
  
  // Sample course data
  const courseInfo = {
    courseName: 'Introduction to Computer Science',
    courseNumber: 'CS 1110',
    section: '001',
    professor: 'John Smith',
    term: 'Fall 2024'
  };
  
  console.log('\nCourse Information:');
  console.log(JSON.stringify(courseInfo, null, 2));
  
  // Create analyzer with stub services
  const analyzer = new CourseAnalyzer(config, true);
  
  console.log('\n' + '='.repeat(60));
  console.log('Starting Analysis...');
  console.log('='.repeat(60) + '\n');
  
  try {
    const result = await analyzer.analyzeCourse(courseInfo);
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📊 FINAL RATING:');
    console.log('─'.repeat(60));
    console.log(`Overall Rating: ${result.finalResult.overallRating}/10`);
    console.log(`Professor Rating: ${result.finalResult.professorRating}/10`);
    console.log(`Course Rating: ${result.finalResult.courseRating}/10`);
    
    console.log('\n📝 FULL ANALYSIS:');
    console.log('─'.repeat(60));
    console.log(result.finalResult.fullAnalysis);
    
    console.log('\n⏱️ TIMING:');
    console.log('─'.repeat(60));
    console.log(`Start: ${result.startTime}`);
    console.log(`End: ${result.endTime}`);
    
    const startTime = new Date(result.startTime);
    const endTime = new Date(result.endTime);
    const duration = (endTime - startTime) / 1000;
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error(error.stack);
  }
}

// Run the test
testCourseAnalyzer();


