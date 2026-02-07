import { useState } from 'react';
import { useRealEstateStore } from '../../store/useRealEstateStore';
import { PropertyForm } from './PropertyForm';
import { SimulationResultView } from './SimulationResult';
import type { RealEstateProperty } from '../../types/realEstate';

interface RealEstateViewProps {
  onNavigate?: (page: string) => void;
}

export function RealEstateView(_props: RealEstateViewProps) {
  const {
    properties,
    selectedPropertyId,
    simulationResult,
    addProperty,
    removeProperty,
    updateProperty,
    selectProperty,
  } = useRealEstateStore();

  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<RealEstateProperty | undefined>();

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  function handleAddProperty(property: RealEstateProperty) {
    if (editingProperty) {
      updateProperty(editingProperty.id, property);
    } else {
      addProperty(property);
    }
    setShowForm(false);
    setEditingProperty(undefined);
  }

  function handleEdit(property: RealEstateProperty) {
    setEditingProperty(property);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    removeProperty(id);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProperty(undefined);
  }

  function yen(v: number): string {
    if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(2) + '億';
    if (Math.abs(v) >= 10000) return (v / 10000).toFixed(0) + '万';
    return v.toLocaleString();
  }

  // フォーム表示モード
  if (showForm) {
    return (
      <div className="re-page">
        <div className="page-header">
          <h1 className="page-title">{editingProperty ? '物件情報を編集' : '新規物件を登録'}</h1>
        </div>
        <PropertyForm onSubmit={handleAddProperty} initialData={editingProperty} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="re-page">
      <div className="page-header">
        <h1 className="page-title">不動産投資シミュレーター</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 物件を登録
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="re-empty">
          <div className="re-empty-icon">🏠</div>
          <h3>物件が登録されていません</h3>
          <p>「物件を登録」ボタンから物件情報を入力して、投資シミュレーションを開始しましょう。</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 16 }}>
            最初の物件を登録
          </button>
        </div>
      ) : (
        <>
          {/* 物件一覧 */}
          <div className="re-property-list">
            {properties.map((p) => (
              <div
                key={p.id}
                className={`re-property-card ${selectedPropertyId === p.id ? 'selected' : ''}`}
                onClick={() => selectProperty(p.id)}
              >
                <div className="re-property-card-header">
                  <div className="re-property-name">{p.property.name || '無名物件'}</div>
                  <div className="re-property-actions">
                    <button
                      className="re-icon-btn"
                      title="編集"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(p);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="re-icon-btn"
                      title="削除"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="re-property-meta">
                  <span>{p.property.location || '所在地未設定'}</span>
                  <span>{p.property.structure}</span>
                  <span>{p.property.floorArea}㎡</span>
                  <span>築{p.property.buildingAge}年</span>
                </div>
                <div className="re-property-numbers">
                  <div className="re-property-stat">
                    <span className="re-stat-label">購入価格</span>
                    <span className="re-stat-value">{yen(p.property.purchasePrice)}円</span>
                  </div>
                  <div className="re-property-stat">
                    <span className="re-stat-label">家賃</span>
                    <span className="re-stat-value">{yen(p.property.monthlyRent)}円/月</span>
                  </div>
                  <div className="re-property-stat">
                    <span className="re-stat-label">表面利回り</span>
                    <span className="re-stat-value">
                      {((p.property.monthlyRent * 12) / p.property.purchasePrice * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* シミュレーション結果 */}
          {selectedProperty && simulationResult && (
            <div style={{ marginTop: 16 }}>
              <SimulationResultView result={simulationResult} property={selectedProperty} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
