import Link from 'next/link';
import TopNavbar from '@/components/TopNavbar';

async function getTestData() {
    const res = await fetch(
      process.env.SERVER_URL + '/api/data',
      { cache: 'no-store' } 
      );

    const data = await res.json();
    return data["testman"] as string[];
}

async function TestPage() {
  const testData = await getTestData();

  return (
    <div>
      <TopNavbar/>
      <h1>Test Page</h1>
      <ul>
        {testData?.map((data, index) => {
          return <li key={index}>{data}</li>;
        })}
      </ul>
    </div>
  );
}

export default TestPage;