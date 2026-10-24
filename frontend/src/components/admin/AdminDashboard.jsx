import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // جلب المستخدمين
    setLoadingUsers(true);
    fetch("http://localhost:5000/api/users")
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
        setLoadingUsers(false);
      });

    // جلب الصور
    setLoadingImages(true);
    fetch("http://localhost:5000/api/images")
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch images');
        }
        return res.json();
      })
      .then(data => {
        setImages(data);
        setLoadingImages(false);
      })
      .catch(err => {
        console.error("Error fetching images:", err);
        setError("Failed to load images");
        setLoadingImages(false);
      });
  }, []);

  const toggleStatus = async (email, newStatus) => {
    try {
      const response = await fetch("http://localhost:5000/api/user/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      setUsers(users.map(u =>
        u.email === email ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Failed to update user status");
    }
  };

  // مكون شاشة التحميل
  const LoadingSpinner = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  // مكون بطاقة تحميل الصور
  const ImageSkeleton = () => (
    <div className="border rounded-lg p-3 shadow animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded"></div>
      <div className="mt-2 h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="mt-2 h-8 bg-gray-200 rounded"></div>
    </div>
  );

  // مكون سطر تحميل الجدول
  const TableRowSkeleton = () => (
    <tr className="border-t animate-pulse">
      <td className="p-2"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="p-2"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
      <td className="p-2"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      <td className="p-2"><div className="h-8 bg-gray-200 rounded w-20"></div></td>
    </tr>
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${loadingUsers ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-sm text-gray-600">Users: {loadingUsers ? 'Loading...' : `${users.length} loaded`}</span>
          <div className={`w-3 h-3 rounded-full ${loadingImages ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-sm text-gray-600">Images: {loadingImages ? 'Loading...' : `${images.length} loaded`}</span>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👥 Users Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="mr-2">👥</span>
            Users Management
            {loadingUsers && (
              <span className="ml-2 text-sm text-blue-600 font-normal">(Loading...)</span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        
        <div className="p-6">
          {loadingUsers ? (
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">👤</div>
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.email} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.status === "active" ? (
                          <button
                            onClick={() => toggleStatus(user.email, "suspended")}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(user.email, "active")}
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ Images Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="mr-2">🖼️</span>
            Uploaded Images
            {loadingImages && (
              <span className="ml-2 text-sm text-blue-600 font-normal">(Loading...)</span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">View and manage all uploaded dental X-ray images</p>
        </div>
        
        <div className="p-6">
          {loadingImages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ImageSkeleton key={i} />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📷</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Images Yet</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                No dental X-ray images have been uploaded yet. Images will appear here once users start uploading.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{images.length}</span> images
                </div>
                
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-56 bg-gray-100">
                      <img
                        src={`data:image/jpeg;base64,${img.data}`}
                        alt={`Dental X-ray ${i + 1}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        #{i + 1}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Uploaded by:</span> {img.uploaded_by}
                        </p>
                        
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`data:image/jpeg;base64,${img.data}`}
                          download={`dental_xray_${img.uploaded_by}_${i}.jpg`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm text-center transition-colors duration-200 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;